import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync,existsSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {fold,normalizeRecord,references,CATEGORIES,recordText} from './catalog.mjs';
import {validateEntity} from './validation.mjs';
import {translate} from '../public/content.mjs';
import {installTranslations,getTranslation} from './translation.mjs';
import {sourceHash,upgradeEncounter} from './encounters.mjs';
export const BACKUP_VERSION=2;
export const now=()=>new Date().toISOString();
export function fail(message,status=400){const e=Error(message);e.status=status;throw e;}
export class Store{
 constructor(path='data/grimorio.sqlite'){
 this.path=path;if(path!==':memory:')mkdirSync(dirname(resolve(path)),{recursive:true});this.db=new DatabaseSync(path);this.db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');this.migrate();installTranslations(this);
 }
 migrate(){this.db.exec(`
 CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,category TEXT NOT NULL,name TEXT NOT NULL,source TEXT NOT NULL,edition TEXT NOT NULL,payload TEXT NOT NULL,search TEXT NOT NULL,imported_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS records_category ON records(category,edition,source);
 CREATE VIRTUAL TABLE IF NOT EXISTS records_fts USING fts5(id UNINDEXED,search,tokenize='unicode61 remove_diacritics 2');
 CREATE TABLE IF NOT EXISTS annotations(record_id TEXT PRIMARY KEY REFERENCES records(id) ON DELETE CASCADE,favorite INTEGER NOT NULL DEFAULT 0,notes TEXT NOT NULL DEFAULT '',name_pt TEXT NOT NULL DEFAULT '',text_pt TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'original',revision INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS campaigns(id TEXT PRIMARY KEY,name TEXT NOT NULL,data TEXT NOT NULL,revision INTEGER NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS entities(id TEXT PRIMARY KEY,campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,kind TEXT NOT NULL,name TEXT NOT NULL,data TEXT NOT NULL,revision INTEGER NOT NULL,updated_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS entities_campaign ON entities(campaign_id,kind);
 CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY AUTOINCREMENT,entity_id TEXT NOT NULL,campaign_id TEXT NOT NULL,kind TEXT NOT NULL,name TEXT NOT NULL,data TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS glossary(term TEXT PRIMARY KEY,translation TEXT NOT NULL,note TEXT NOT NULL DEFAULT '',revision INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS translation_cache(hash TEXT PRIMARY KEY,payload TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS imports(id TEXT PRIMARY KEY,filename TEXT NOT NULL,summary TEXT NOT NULL,created_at TEXT NOT NULL);
 INSERT OR IGNORE INTO migrations VALUES(1,datetime('now'));
 PRAGMA user_version=1;`);}
 transaction(fn){this.db.exec('BEGIN IMMEDIATE');try{const result=fn();this.db.exec('COMMIT');return result;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 close(){this.db.close();}
 translation(record){return getTranslation(this,record);}
 record(id){const row=this.db.prepare('SELECT * FROM records WHERE id=?').get(id);if(!row)return null;const r=JSON.parse(row.payload);const a=this.db.prepare('SELECT * FROM annotations WHERE record_id=?').get(id);return {...r,translation:getTranslation(this,r),sourceHash:sourceHash(r),importedAt:row.imported_at,annotation:a?{favorite:!!a.favorite,notes:a.notes,namePt:a.name_pt,textPt:a.text_pt,status:a.status,revision:a.revision}:{favorite:false,notes:'',namePt:r.namePt||'',textPt:r.textPt||'',status:r.translationStatus||'original',revision:0}};}
 index(id){const r=this.record(id);const search=fold([r.name,translate(r.name,{glossary:this.db.prepare('SELECT term,translation FROM glossary').all()}),r.annotation.namePt,r.text,r.annotation.textPt,...Object.values(r.translation?.segments||{}).map(x=>x.text),r.source,r.category].join(' '));this.db.prepare('UPDATE records SET search=? WHERE id=?').run(search,id);this.db.prepare('DELETE FROM records_fts WHERE id=?').run(id);this.db.prepare('INSERT INTO records_fts(id,search) VALUES(?,?)').run(id,search);}
 upsertRecords(records){
 let added=0,updated=0;const q=this.db.prepare('INSERT INTO records(id,category,name,source,edition,payload,search,imported_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET category=excluded.category,name=excluded.name,source=excluded.source,edition=excluded.edition,payload=excluded.payload,imported_at=excluded.imported_at');
 for(const input of records){const r=normalizeRecord(input);const old=this.record(r.id);old?updated++:added++;q.run(r.id,r.category,r.name,r.source,r.edition,JSON.stringify(r),'',now());this.index(r.id);}
 return {added,updated};
 }
 seed(path){if(!existsSync(path))return;const content=readFileSync(path,'utf8');const b=JSON.parse(content);const key=`srd:${createHash('sha256').update(content).digest('hex')}`;if(this.db.prepare('SELECT 1 FROM imports WHERE id=?').get(key))return;this.transaction(()=>{const result=this.upsertRecords(b.records);this.db.prepare('INSERT INTO imports VALUES(?,?,?,?)').run(key,'open-srd.json',JSON.stringify(result),now());});}
 search(p={}){
 const where=[],args=[];
 for(const k of ['category','source','edition'])if(p[k]){where.push(k==='edition'&&p.includeHomebrew==='true'?`(r.edition=? OR r.edition='caseiro')`:`r.${k}=?`);args.push(p[k]);}
 if(p.q){const words=fold(p.q).match(/[\p{L}\p{N}]+/gu)||[];if(words.length){where.push('r.id IN (SELECT id FROM records_fts WHERE records_fts MATCH ?)');args.push(words.map(x=>'"'+x+'"*').join(' AND '));}}
 if(p.favorite==='true')where.push('a.favorite=1');
 const sql=`SELECT r.id FROM records r LEFT JOIN annotations a ON a.record_id=r.id ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY ${p.preferredEdition?'CASE WHEN r.edition=? THEN 0 ELSE 1 END,':''} r.name COLLATE NOCASE`;
 if(p.preferredEdition)args.push(p.preferredEdition);
 const rows=this.db.prepare(sql).all(...args);let list=rows.map(x=>this.record(x.id));
 const contains=(value,query)=>fold(JSON.stringify(value??'')).includes(fold(query));
 for(const k of ['level','school','cr','type','size','environment','rarity','property'])if(p[k])list=list.filter(r=>k==='level'||k==='cr'?String(r.facets[k])===p[k]:contains(r.facets[k],p[k]));
 for(const k of ['concentration','ritual','attunement'])if(p[k])list=list.filter(r=>!!r.facets[k]===(p[k]==='true'));
 if(p.class)list=list.filter(r=>contains(r.facets.classes,p.class));
 if(p.excludeHomebrew==='true')list=list.filter(r=>r.edition!=='caseiro'&&!r.raw.isHomebrew);
 if(p.allowedSources)list=list.filter(r=>p.allowedSources.split(',').includes(r.source)||(p.includeHomebrew==='true'&&r.edition==='caseiro'));
 const total=list.length;const offset=Math.max(0,Number(p.offset)||0);const limit=Math.min(200,Math.max(1,Number(p.limit)||60));
 return {total,results:list.slice(offset,offset+limit).map(({raw,text,...r})=>({...r,excerpt:recordText(raw).slice(0,180)}))};
 }
 details(id){let r=this.record(id);if(!r)fail('Registro não encontrado.',404);const refs=references(r).map(ref=>{let match=this.db.prepare('SELECT id FROM records WHERE category IN (?,?) AND lower(name)=lower(?) AND lower(source)=lower(?) AND edition=?').all(ref.category,ref.category==='item'?'baseitem':ref.category,ref.name,ref.source,r.edition).map(x=>this.record(x.id));if(ref.className)match=match.filter(x=>fold(x.raw.className)===fold(ref.className)&&(!ref.level||String(x.raw.level)===ref.level));return {...ref,ids:match.map(x=>x.id)};});const alternatives=this.db.prepare('SELECT id FROM records WHERE lower(name)=lower(?) AND category=? AND id<>?').all(r.name,r.category,r.id).map(x=>this.record(x.id)).map(x=>({id:x.id,name:x.name,edition:x.edition,source:x.source}));return {...r,references:refs,alternatives};}
 annotate(id,input){if(!this.record(id))fail('Registro não encontrado.',404);const old=this.record(id).annotation;if(input.revision!==old.revision)fail('Este registro foi alterado em outra aba. Recarregue antes de salvar; sua edição foi mantida.',409);const statuses=['original','automática','revisada','manual'];if(!statuses.includes(input.status||'original'))fail('Estado de tradução inválido.');const a={favorite:!!input.favorite,notes:String(input.notes||''),namePt:String(input.namePt||''),textPt:String(input.textPt||''),status:input.status||'original'};this.db.prepare('INSERT INTO annotations VALUES(?,?,?,?,?,?,?) ON CONFLICT(record_id) DO UPDATE SET favorite=excluded.favorite,notes=excluded.notes,name_pt=excluded.name_pt,text_pt=excluded.text_pt,status=excluded.status,revision=excluded.revision').run(id,+a.favorite,a.notes,a.namePt,a.textPt,a.status,old.revision+1);this.index(id);return this.record(id);}
 campaigns(){return this.db.prepare('SELECT * FROM campaigns ORDER BY updated_at DESC').all().map(x=>({...x,data:JSON.parse(x.data)}));}
 campaign(id){return this.campaigns().find(x=>x.id===id)||null;}
 saveCampaign(input){if(input.id!==undefined&&(typeof input.id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_.:@-]{0,199}$/.test(input.id)))fail('Identificador inválido.');if(typeof input.name!=='string'||!input.name.trim())fail('Dê um nome à campanha.');const id=input.id||randomUUID();const old=this.campaign(id);if(old&&input.revision!==old.revision)fail('Campanha alterada em outra aba. Sua edição continua no formulário.',409);const data=input.data||{};if(!['2014','2024'].includes(data.edition))fail('Selecione a versão principal das regras.');const revision=(old?.revision||0)+1;this.db.prepare('INSERT INTO campaigns VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,data=excluded.data,revision=excluded.revision,updated_at=excluded.updated_at').run(id,input.name,JSON.stringify(data),revision,now());return this.campaign(id);}
 entities(cid){return this.db.prepare('SELECT * FROM entities WHERE campaign_id=? ORDER BY updated_at DESC').all(cid).map(x=>({...x,data:JSON.parse(x.data)}));}
 entity(id){const x=this.db.prepare('SELECT * FROM entities WHERE id=?').get(id);return x?{...x,data:JSON.parse(x.data)}:null;}
 saveEntity(input,{force=false}={}){if(input.id!==undefined&&(typeof input.id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_.:@-]{0,199}$/.test(input.id)))fail('Identificador inválido.');if(!this.campaign(input.campaign_id))fail('Campanha não encontrada.',404);if(typeof input.name!=='string'||!input.name.trim()||input.name.length>500||typeof input.kind!=='string'||!input.data||typeof input.data!=='object'||Array.isArray(input.data))fail('Elemento inválido.');validateEntity(input.kind,input.data);const id=input.id||randomUUID();let old=this.entity(id);if(old&&old.campaign_id!==input.campaign_id)fail('Um elemento não pode mudar de campanha.');if(old&&!force&&input.revision!==old.revision)fail('Elemento alterado em outra aba. Sua edição foi mantida. Copie seu texto antes de recarregar.',409);if(old){this.db.prepare('INSERT INTO history(entity_id,campaign_id,kind,name,data,created_at) VALUES(?,?,?,?,?,?)').run(old.id,old.campaign_id,old.kind,old.name,JSON.stringify(old.data),now());this.db.prepare('DELETE FROM history WHERE entity_id=? AND id NOT IN (SELECT id FROM history WHERE entity_id=? ORDER BY id DESC LIMIT 50)').run(id,id);}
 this.db.prepare('INSERT INTO entities VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,name=excluded.name,data=excluded.data,revision=excluded.revision,updated_at=excluded.updated_at').run(id,input.campaign_id,input.kind,input.name,JSON.stringify(input.data),(old?.revision||0)+1,now());return this.entity(id);}
 undo(id,revision){const old=this.entity(id);if(!old)fail('Elemento não encontrado.',404);if(old.revision!==revision)fail('Estado mudou antes de desfazer. Recarregue.',409);const h=this.db.prepare('SELECT * FROM history WHERE entity_id=? ORDER BY id DESC LIMIT 1').get(id);if(!h)fail('Nenhuma ação anterior disponível.');this.db.prepare('DELETE FROM history WHERE id=?').run(h.id);this.db.prepare('UPDATE entities SET name=?,kind=?,data=?,revision=?,updated_at=? WHERE id=?').run(h.name,h.kind,h.data,old.revision+1,now(),id);return this.entity(id);}
 exportBackup(){const tables=['records','annotations','campaigns','entities','history','glossary','translation_cache','imports','content_translations'];const data=Object.fromEntries(tables.map(t=>[t,this.db.prepare(`SELECT * FROM ${t}`).all()]));return {format:'grimorio-backup',version:BACKUP_VERSION,databaseVersion:2,createdAt:now(),data};}
 validateBackup(b){
 if(b?.format!=='grimorio-backup'||![1,2].includes(b.version)||![1,2].includes(b.databaseVersion))fail('Formato ou versão do backup incompatível.');
 if(b.version===1&&!b.data.content_translations)b.data.content_translations=[];
 const tables=['records','annotations','campaigns','entities','history','glossary','translation_cache','imports','content_translations'];for(const t of tables)if(!Array.isArray(b.data?.[t])||b.data[t].length>200000)fail(`Tabela inválida: ${t}`);
 const ids=new Set(),cids=new Set();
 for(const r of b.data.records){const p=normalizeRecord(JSON.parse(r.payload));if(p.id!==r.id||ids.has(r.id)||p.name!==r.name||p.category!==r.category||p.source!==r.source||p.edition!==r.edition)fail('Registros duplicados ou inconsistentes no backup.');ids.add(r.id);}
 for(const c of b.data.campaigns){const d=JSON.parse(c.data);if(typeof c.name!=='string'||!c.name.trim()||!Number.isInteger(c.revision)||c.revision<1||cids.has(c.id)||!['2014','2024'].includes(d.edition))fail('Campanha inválida no backup.');cids.add(c.id);}
 const eids=new Set();for(const e of b.data.entities){if(eids.has(e.id)||!cids.has(e.campaign_id)||!JSON.parse(e.data))fail('Vínculo de campanha inválido.');validateEntity(e.kind,JSON.parse(e.data));if(!Number.isInteger(e.revision)||e.revision<1)fail('Revisão inválida.');eids.add(e.id);}
 for(const a of b.data.annotations)if(!ids.has(a.record_id)||!Number.isInteger(a.revision)||a.revision<1)fail('Anotação sem registro ou revisão válida.');
 for(const x of b.data.history){if(!eids.has(x.entity_id)||!cids.has(x.campaign_id))fail('Histórico sem elemento correspondente.');validateEntity(x.kind,JSON.parse(x.data));}
 return {records:ids.size,campaigns:cids.size,entities:eids.size,annotations:b.data.annotations.length};
 }
 restore(b){this.validateBackup(b);this.transaction(()=>{const order=['content_translations','history','annotations','entities','campaigns','records','glossary','translation_cache','imports'];for(const t of order)this.db.exec(`DELETE FROM ${t}`);this.db.exec('DELETE FROM records_fts');for(const t of ['records','annotations','campaigns','entities','history','glossary','translation_cache','imports','content_translations']){const cols=this.db.prepare(`PRAGMA table_info(${t})`).all().map(x=>x.name);const q=this.db.prepare(`INSERT INTO ${t}(${cols.join(',')}) VALUES(${cols.map(()=>'?').join(',')})`);for(const row of b.data[t])q.run(...cols.map(k=>row[k]??null));}for(const r of b.data.records)this.index(r.id);if(this.db.prepare('PRAGMA foreign_key_check').all().length)fail('Backup contém vínculos inválidos.');});return this.validateBackup(b);}
 coverage(inventory){const actual=this.db.prepare('SELECT category,edition,count(*) count FROM records GROUP BY category,edition').all();const keys=new Set([...Object.keys(CATEGORIES),...Object.keys(inventory?.categories||{}),...actual.map(x=>x.category)]);return [...keys].map(key=>({key,name:CATEGORIES[key]||key,upstream:inventory?.categories?.[key]?.total??null,open:inventory?.categories?.[key]?.open??0,local:actual.filter(x=>x.category===key).reduce((s,x)=>s+x.count,0),editions:actual.filter(x=>x.category===key),status:actual.some(x=>x.category===key)?'Integração parcial; conferir fontes':'Depende de importação local ou material aberto disponível'}));}
}
