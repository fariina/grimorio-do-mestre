import http from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync,createReadStream} from 'node:fs';
import {resolve,extname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {Store,fail,now} from './lib/store.mjs';
import {parseImport,CATEGORIES,plain} from './lib/catalog.mjs';
import {difficulty,roll,treasure,validateTreasureTable} from './lib/rules.mjs';
import {changeCombat,combatant} from './lib/combat.mjs';
import {integrationApi,initializeIntegration} from './lib/integration-api.mjs';
import {translationConfig} from './lib/translation.mjs';
import {deploymentConfig} from './lib/deployment.mjs';
import {Auth} from './lib/auth.mjs';

export function createApplication({config=deploymentConfig(),dbPath=config.dbPath,seed=true,root=resolve(fileURLToPath(new URL('.',import.meta.url))),authOptions={}}={}){
 const auth=new Auth(config,authOptions);
 const store=new Store(dbPath);if(seed)store.seed(join(root,'reference/open-srd.json'));
 initializeIntegration(store,root);
 const localToken=randomBytes(32).toString('hex');const previews=new Map();const inventory=existsSync(join(root,'reference/inventory.json'))?JSON.parse(readFileSync(join(root,'reference/inventory.json'),'utf8')):{};
 const send=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj));};
 function preview(value){const id=randomUUID();previews.set(id,{...value,expires:Date.now()+30*60e3});for(const [k,v]of previews)if(v.expires<Date.now())previews.delete(k);return id;}
 function getPreview(id,type){const p=previews.get(id);if(!p||p.expires<Date.now()||p.type!==type)fail('Prévia expirada ou inválida. Leia o arquivo novamente.');return p;}
 const server=http.createServer(async(req,res)=>{
 try{
 const host=req.headers.host||'';
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
 const url=new URL(req.url,'http://127.0.0.1');const path=url.pathname;const method=req.method;
 const access=await auth.intercept(req,res,url);if(access.handled)return;const token=access.session?.csrf||localToken;
 if(!['GET','HEAD'].includes(method)){
 if(req.headers['x-grimorio-token']!==token)fail('Token local ausente. Atualize a página.',403);
 if(config.mode==='local'&&req.headers.origin&&req.headers.origin!==`http://${host}`)fail('Origem da requisição não permitida.',403);
 }
 let input={};if(['POST','PUT','PATCH'].includes(method)){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>config.maxBytes)fail('Arquivo excede o limite de upload configurado.',413);chunks.push(chunk);}try{input=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}catch{fail('JSON inválido.');}}
 const integrated=await integrationApi({store,path,method,input,url});if(integrated)return send(res,integrated.status,integrated.body);
 if(path==='/api/bootstrap')return send(res,200,{token,campaigns:store.campaigns(),categories:CATEGORIES,stats:{records:store.db.prepare('SELECT count(*) n FROM records').get().n},sources:store.db.prepare('SELECT source,edition,count(*) count FROM records GROUP BY source,edition ORDER BY source').all(),version:'1.2.0',auth:{mode:config.mode,...(access.session?{user:{id:access.session.user_id,login:access.session.login}}:{})},glossary:store.db.prepare('SELECT term,translation,note FROM glossary').all(),translationConfig:translationConfig(),translation:'Sem serviço externo. Traduções manuais e lotes locais disponíveis.'});
 if(path==='/api/records'&&method==='GET')return send(res,200,store.search(Object.fromEntries(url.searchParams)));
 let m;
 if((m=path.match(/^\/api\/records\/([^/]+)$/))&&method==='GET')return send(res,200,store.details(m[1]));
 if((m=path.match(/^\/api\/records\/([^/]+)\/annotation$/))&&method==='PUT')return send(res,200,store.transaction(()=>store.annotate(m[1],input)));
 if(path==='/api/campaigns'&&method==='POST')return send(res,201,store.saveCampaign(input));
 if((m=path.match(/^\/api\/campaigns\/([^/]+)$/))&&method==='PUT')return send(res,200,store.saveCampaign({...input,id:m[1]}));
 if((m=path.match(/^\/api\/campaigns\/([^/]+)\/entities$/))&&method==='GET')return send(res,200,store.entities(m[1]));
 if(path==='/api/entities'&&method==='POST')return send(res,201,store.transaction(()=>store.saveEntity(input)));
 if((m=path.match(/^\/api\/entities\/([^/]+)$/))&&method==='PUT')return send(res,200,store.transaction(()=>store.saveEntity({...input,id:m[1]})));
 if((m=path.match(/^\/api\/entities\/([^/]+)\/undo$/))&&method==='POST')return send(res,200,store.transaction(()=>store.undo(m[1],input.revision)));
 if((m=path.match(/^\/api\/entities\/([^/]+)\/duplicate$/))&&method==='POST'){const e=store.entity(m[1]);if(!e)fail('Elemento não encontrado.',404);return send(res,201,store.saveEntity({campaign_id:e.campaign_id,kind:e.kind,name:input.name||`${e.name} (cópia)`,data:{...e.data,template:!!input.template}}));}
 if(path==='/api/difficulty'&&method==='POST')return send(res,200,difficulty(input));
 if(path==='/api/roll'&&method==='POST')return send(res,200,roll(input.expression));
 if(path==='/api/combat/start'&&method==='POST'){
 const e=store.entity(input.encounterId);if(!e||e.kind!=='encounter')fail('Encontro não encontrado.');const c=store.campaign(e.campaign_id);const participants=[];
 for(const enemy of e.data.monsters||[]){if(enemy.edition&&enemy.edition!==c.data.edition&&!input.allowMixed)fail('Há criaturas de outra edição. Confirme explicitamente a mistura neste encontro.');let maxHp=Number(enemy.maxHp);const record=enemy.recordId?store.record(enemy.recordId):null;if(!maxHp)maxHp=record?.raw.hp?.average;if(!maxHp)fail(`Defina PV máximos de ${enemy.name}; a ficha não possui valor numérico.`);for(let i=0;i<Number(enemy.quantity||1);i++)participants.push(combatant({name:`${enemy.name}${enemy.quantity>1?' '+(i+1):''}`,recordId:enemy.recordId,group:enemy.name,maxHp,side:enemy.side||'enemy',initiativeBonus:enemy.initiativeBonus??Math.floor(((record?.raw.dex||10)-10)/2)}));}
 for(const p of store.entities(e.campaign_id).filter(x=>x.kind==='character'&&x.data.active!==false))participants.push(combatant({name:p.name,maxHp:Number(p.data.maxHp)||10,side:'ally',initiativeBonus:Number(p.data.initiativeBonus)||0,group:'Personagens'}));
 return send(res,201,store.saveEntity({campaign_id:e.campaign_id,kind:'combat',name:`Combate — ${e.name}`,data:{encounterId:e.id,round:1,turn:0,participants,log:[{at:now(),note:'Combate iniciado. Iniciativa ainda não rolada.'}]}}));
 }
 if((m=path.match(/^\/api\/combat\/([^/]+)\/action$/))&&method==='POST')return send(res,200,store.transaction(()=>{const e=store.entity(m[1]);if(!e||e.kind!=='combat')fail('Combate não encontrado.');if(e.revision!==input.revision)fail('O combate mudou em outra aba. Recarregue antes de agir.',409);return store.saveEntity({...e,data:changeCombat(e.data,input.action)});}));
 if(path==='/api/import/preview'&&method==='POST'){
 const parsed=(input.files||[{filename:input.filename,content:input.content}]).map(f=>parseImport({...input,...f}));
 const result={filename:parsed.map(x=>x.filename).join(', '),records:parsed.flatMap(x=>x.records),entities:parsed.flatMap(x=>x.entities),warnings:parsed.flatMap(x=>x.warnings)};
 if(input.target==='campaign'&&!store.campaign(input.campaignId))fail('Selecione uma campanha antes de importar.');
 const changes=result.records.map(r=>({id:r.id,name:r.name,category:r.category,edition:r.edition,source:r.source,action:store.record(r.id)?'atualizar':'adicionar'}));const entities=result.entities.map(x=>({...x,action:x.id&&store.entity(x.id)?'atualizar':'adicionar'}));
 return send(res,200,{previewId:preview({type:'import',result,campaignId:input.campaignId}),count:changes.length+entities.length,changes,entities,warnings:result.warnings,notes:'Atualizações da biblioteca preservam notas, favoritos e traduções. Elementos da campanha só são substituídos se você marcar a opção de atualização.'});
 }
 if(path==='/api/import/apply'&&method==='POST'){
 const p=getPreview(input.previewId,'import');const selected=new Set(input.selectedIds||p.result.records.map(x=>x.id));
 const result=store.transaction(()=>{const result=store.upsertRecords(p.result.records.filter(r=>selected.has(r.id)));let entities=0;for(const e of p.result.entities){const old=e.id?store.entity(e.id):null;if(old&&!input.updateExisting)continue;if(old&&old.campaign_id!==p.campaignId)fail('Elemento pertence a outra campanha.');store.saveEntity({...e,campaign_id:p.campaignId,revision:old?.revision});entities++;}store.db.prepare('INSERT INTO imports VALUES(?,?,?,?)').run(randomUUID(),p.result.filename,JSON.stringify({...result,entities}),now());return {...result,entities};});previews.delete(input.previewId);return send(res,200,result);
 }
 if(path==='/api/backup'&&method==='GET'){res.setHeader('Content-Disposition',`attachment; filename="grimorio-backup-${now().slice(0,10)}.json"`);return send(res,200,store.exportBackup());}
 if(path==='/api/backup/preview'&&method==='POST'){const summary=store.validateBackup(input.backup);return send(res,200,{...summary,previewId:preview({type:'backup',backup:input.backup}),warning:'A restauração substitui o banco inteiro. Um backup anterior será salvo no diretório backups.'});}
 if(path==='/api/backup/restore'&&method==='POST'){
 const p=getPreview(input.previewId,'backup');if(input.confirm!=='RESTAURAR')fail('Digite RESTAURAR para substituir o banco.');if(dbPath!==':memory:'){const dir=config.backupDir;mkdirSync(dir,{recursive:true});writeFileSync(join(dir,`antes-restauracao-${Date.now()}.json`),JSON.stringify(store.exportBackup()));}const summary=store.restore(p.backup);previews.delete(input.previewId);return send(res,200,summary);
 }
 if(path==='/api/coverage')return send(res,200,{checkedAt:inventory.checkedAt,commit:inventory.commit,errors:inventory.errors||[],categories:store.coverage(inventory),imports:store.db.prepare('SELECT * FROM imports ORDER BY created_at DESC LIMIT 30').all()});
 if(path==='/api/glossary'&&method==='GET')return send(res,200,store.db.prepare('SELECT * FROM glossary ORDER BY term').all());
 if(path==='/api/glossary'&&method==='PUT'){if(!input.term||!input.translation)fail('Informe termo e tradução.');store.db.prepare('INSERT INTO glossary(term,translation,note) VALUES(?,?,?) ON CONFLICT(term) DO UPDATE SET translation=excluded.translation,note=excluded.note,revision=revision+1').run(String(input.term),String(input.translation),String(input.note||''));for(const x of store.db.prepare('SELECT id FROM records WHERE lower(name)=lower(?)').all(String(input.term)))store.index(x.id);return send(res,200,{saved:true});}
 if(path==='/api/translation/export'&&method==='POST'){
 const ids=Array.isArray(input.ids)?input.ids.slice(0,100):[];const records=ids.map(id=>store.record(id)).filter(Boolean).filter(r=>!r.annotation.textPt||input.includeTranslated).map(r=>({id:r.id,hash:createHash('sha256').update(r.text).digest('hex'),nameOriginal:r.name,textOriginal:r.text,edition:r.edition,source:r.source,namePt:r.annotation.namePt,textPt:r.annotation.textPt,status:r.annotation.status}));return send(res,200,{format:'grimorio-translations',version:1,glossary:store.db.prepare('SELECT * FROM glossary').all(),records});
 }
 if(path==='/api/translation/preview'&&method==='POST'){
 const b=input.bundle;if(b?.format!=='grimorio-translations'||b.version!==1||!Array.isArray(b.records)||b.records.length>1000)fail('Lote de tradução inválido (máximo 1.000).');const changes=b.records.map(x=>{const r=store.record(x.id);if(!r)fail(`Registro ausente: ${x.id}`);const hash=createHash('sha256').update(r.text).digest('hex');if(hash!==x.hash)fail(`O original de ${r.name} mudou; exporte um novo lote.`);const nums=s=>(s.match(/[+\-]?\d+(?:[.,/]\d+)?(?:d\d+)?/g)||[]).sort().join('|');const warnings=nums(r.text)!==nums(x.textPt||'')?['Números, frações ou dados diferem do original. Revise antes de aplicar.']:[];return {...x,revision:r.annotation.revision,warnings};});return send(res,200,{previewId:preview({type:'translation',changes}),changes});
 }
 if(path==='/api/translation/apply'&&method==='POST'){const p=getPreview(input.previewId,'translation');if(p.changes.some(x=>x.warnings.length)&&!input.acceptWarnings)fail('Revise e aceite os alertas numéricos.');const result=store.transaction(()=>{let applied=0,cached=0;for(const x of p.changes){const r=store.record(x.id);const key=createHash('sha256').update([x.hash,x.namePt,x.textPt,x.status].join('|')).digest('hex');if(store.db.prepare('SELECT 1 FROM translation_cache WHERE hash=?').get(key)){cached++;continue;}store.annotate(x.id,{...r.annotation,revision:x.revision,namePt:x.namePt,textPt:x.textPt,status:x.status==='revisada'?'revisada':x.status==='automática'?'automática':'manual'});store.db.prepare('INSERT INTO translation_cache VALUES(?,?,?)').run(key,JSON.stringify(x),now());applied++;}return {applied,cached};});previews.delete(input.previewId);return send(res,200,result);}
 if(path==='/api/treasure/validate'&&method==='POST')return send(res,200,validateTreasureTable(input.table));
 if(path==='/api/treasure'&&method==='POST'){
 let table=input.table;if(input.tableId){const r=store.record(input.tableId);if(!r)fail('Tabela não encontrada.');table={...r.raw,id:r.id,name:r.name,source:r.source,edition:r.edition};}return send(res,200,treasure(table));
 }
 if(path==='/api/validate-links'){
 const entities=store.entities(url.searchParams.get('campaignId')||'');const ids=new Set(entities.map(x=>x.id));return send(res,200,{broken:entities.flatMap(e=>(e.data.links||[]).filter(id=>!ids.has(id)&&!store.record(id)).map(id=>({from:e.id,name:e.name,to:id}))),total:entities.length});
 }
 if(path.startsWith('/api/'))return send(res,404,{error:'Operação não encontrada.'});
 if(!['GET','HEAD'].includes(method))fail('Método não permitido.',405);
 const files={'/':'public/index.html','/app.js':'public/app.js','/style.css':'public/style.css','/favicon.svg':'public/favicon.svg','/docs/README.md':'README.md','/docs/PUBLICACAO.md':'docs/PUBLICACAO.md','/docs/COBERTURA.md':'docs/COBERTURA.md','/docs/FONTES.md':'docs/FONTES.md','/reference/srd-5.2.1.pdf':'reference/srd-5.2.1.pdf','/reference/srd-5.1.pdf':'reference/srd-5.1.pdf'};
 if(['/vendor/pdf.mjs','/vendor/pdf.worker.mjs'].includes(path))files[path]='public'+path;
 if(path==='/content.mjs')files[path]='public/content.mjs';
 if(path==='/integration.js')files[path]='public/integration.js';
 if(path==='/integration.css')files[path]='public/integration.css';
 if(path==='/pdf-import.js')files[path]='public/pdf-import.js';
 if(/^\/vendor\/(cmaps|standard_fonts)\/[A-Za-z0-9_.-]+\.(bcmap|pfb|ttf)$/.test(path))files[path]='public'+path;
 if(path==='/docs/PUBLICACAO.md')files[path]='docs/PUBLICACAO.md';
 if(files[path]&&!existsSync(join(root,files[path]))&&path.startsWith('/vendor/')){const suffix=path.slice('/vendor/'.length);files[path]=['pdf.mjs','pdf.worker.mjs'].includes(suffix)?'node_modules/pdfjs-dist/legacy/build/'+suffix:'node_modules/pdfjs-dist/'+suffix;}
 if(!files[path]||!existsSync(join(root,files[path])))fail('Arquivo não encontrado.',404);
 const type={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8','.pdf':'application/pdf'}[extname(files[path])]||'application/octet-stream';res.writeHead(200,{'Content-Type':type,'Cache-Control':config.mode==='github'?'private, no-store':'no-cache'});if(method==='HEAD')res.end();else createReadStream(join(root,files[path])).pipe(res);
 }catch(e){send(res,e.status||400,{error:e.message||'Erro inesperado.'});}
 });
 server.on('close',()=>auth.close());
 return {server,store,auth,config};
}
function dirnameSafe(path){return resolve(path,'..');}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(existsSync('.env'))process.loadEnvFile('.env');
 const {server,store,config}=createApplication();const port=Number(process.env.PORT)||3210;server.listen(port,config.host,()=>console.log(`Grimório do Mestre: ${config.origin||'http://127.0.0.1:'+port}\nAcesso ${config.mode==='github'?'autenticado por GitHub':'local'}. Ctrl+C para encerrar.`));server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`A porta ${port} já está ocupada. Altere PORT em .env ou use o servidor já aberto.`:e.message);store.close();process.exitCode=1;});
 let stopping=false;const stop=()=>{if(stopping)return;stopping=true;server.close(()=>{store.close();process.exitCode=0;});};process.on('SIGINT',stop);process.on('SIGTERM',stop);
}
