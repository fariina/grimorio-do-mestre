import {createHash} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {sourceHash} from './encounters.mjs';
import {TERMS,collectSegments,mechanicalSignature,protectText,translate} from '../public/content.mjs';
export const translationConfig=()=>{
 const url=process.env.TRANSLATION_URL||'';let local=false,parsed;try{parsed=new URL(url);if(!['http:','https:'].includes(parsed.protocol))parsed=null;local=!!parsed&&['127.0.0.1','localhost','[::1]'].includes(parsed.hostname);}catch{}
 return {configured:!!parsed,url:parsed?.origin||'',local,provider:'LibreTranslate',target:'pt',missing:parsed?[]:[url?'TRANSLATION_URL está inválida':'TRANSLATION_URL (URL de uma instância LibreTranslate, preferencialmente local)'],apiKeyConfigured:!!process.env.TRANSLATION_API_KEY};
};
export function installTranslations(store){
 store.db.exec(`CREATE TABLE IF NOT EXISTS content_translations(record_id TEXT NOT NULL,source_hash TEXT NOT NULL,segments TEXT NOT NULL,state TEXT NOT NULL,revision INTEGER NOT NULL,error TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL,PRIMARY KEY(record_id,source_hash));CREATE TABLE IF NOT EXISTS render_diagnostics(tag TEXT PRIMARY KEY,sample TEXT NOT NULL,count INTEGER NOT NULL,last_seen TEXT NOT NULL);INSERT OR IGNORE INTO migrations VALUES(2,datetime('now'));PRAGMA user_version=2;`);
 const q=store.db.prepare('INSERT OR IGNORE INTO glossary(term,translation,note) VALUES(?,?,?)');for(const [term,value]of Object.entries(TERMS))q.run(term,value,'Glossário editorial local; editável e não oficial.');
}
export function getTranslation(store,record){
 const hash=sourceHash(record);const row=store.db.prepare('SELECT * FROM content_translations WHERE record_id=? AND source_hash=?').get(record.id,hash);
 const previous=!row?store.db.prepare('SELECT * FROM content_translations WHERE record_id=? ORDER BY updated_at DESC LIMIT 1').get(record.id):null;
 if(!row&&!previous)return {sourceHash:hash,segments:{},state:'pending',revision:0,error:'',missing:null,total:null,complete:false,stale:false,previous:null};
 const segments=row?JSON.parse(row.segments):{};const glossary=store.db.prepare('SELECT term,translation FROM glossary').all();
 const texts=collectSegments(record);const missing=texts.filter(s=>!segments[s]?.text&&translate(s,{glossary})===s);
 return {sourceHash:hash,segments,state:row?.state||'pending',revision:row?.revision||0,error:row?.error||'',missing:missing.length,total:texts.length,complete:!!row&&!missing.length&&row.state!=='failed',stale:!!previous,previous:previous?{sourceHash:previous.source_hash,segments:JSON.parse(previous.segments),state:previous.state}:null};
}
export function saveTranslation(store,record,input){
 const current=getTranslation(store,record);if(input.sourceHash!==current.sourceHash)throw Error('A fonte mudou. Reabra a tradução; suas correções anteriores foram preservadas.');
 if(input.revision!==current.revision)throw Error('A tradução mudou em outra aba. Recarregue antes de salvar.');
 const allowed=new Set(collectSegments(record));const segments={...current.segments};
 for(const [original,value]of Object.entries(input.segments||{})){
 if(!allowed.has(original))throw Error('Trecho não pertence a esta versão da ficha.');const text=typeof value==='string'?value:value.text;
 if(typeof text!=='string'||text.length>100000)throw Error('Tradução inválida.');if(!text.trim()){delete segments[original];continue;}
 if(mechanicalSignature(original)!==mechanicalSignature(text))throw Error('A tradução alterou valores ou marcações mecânicas. Preserve números, dados e referências.');
 const manual=!input.automatic||(typeof value==='object'&&value.locked&&value.state==='reviewed');segments[original]={text,state:manual?'reviewed':'automatic',locked:manual};
 }
 const state=input.failed?'failed':Object.values(segments).every(x=>x.state==='reviewed')?'reviewed':'automatic';
 store.db.prepare('INSERT INTO content_translations VALUES(?,?,?,?,?,?,?) ON CONFLICT(record_id,source_hash) DO UPDATE SET segments=excluded.segments,state=excluded.state,revision=excluded.revision,error=excluded.error,updated_at=excluded.updated_at').run(record.id,current.sourceHash,JSON.stringify(segments),state,current.revision+1,input.error||'',new Date().toISOString());
 store.index(record.id);return getTranslation(store,record);
}
export async function translateRecord(store,record,{consentExternal=false,transport=fetch}={}){
 const config=translationConfig();if(!config.configured)throw Error('Tradução automática não configurada. Falta TRANSLATION_URL; configure uma instância LibreTranslate com inglês/espanhol e português.');
 if(!config.local&&!consentExternal)throw Error('Confirme o envio deste conteúdo ao serviço externo configurado antes de traduzir.');
 const before=getTranslation(store,record);const glossary=store.db.prepare('SELECT term,translation FROM glossary').all();const segments={};
 try{
 for(const original of collectSegments(record)){
 if(before.segments[original]?.text)continue;
 const previous=before.previous?.segments?.[original];if(previous?.locked){segments[original]=previous;continue;}
 const known=translate(original,{glossary});if(known!==original){segments[original]=known;continue;}
 const protectedText=protectText(original,{glossary});
 const cacheKey=createHash('sha256').update(JSON.stringify([config.url,protectedText.text,glossary])).digest('hex');
 let translated=store.db.prepare('SELECT payload FROM translation_cache WHERE hash=?').get(cacheKey)?.payload;
 if(translated)translated=JSON.parse(translated).translated;
 else {const response=await transport(new URL('translate',process.env.TRANSLATION_URL.endsWith('/')?process.env.TRANSLATION_URL:process.env.TRANSLATION_URL+'/'),{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),body:JSON.stringify({q:protectedText.text,source:process.env.TRANSLATION_SOURCE||'auto',target:'pt',format:'text',...(process.env.TRANSLATION_API_KEY?{api_key:process.env.TRANSLATION_API_KEY}:{})})});if(!response.ok)throw Error(`Serviço respondeu HTTP ${response.status}.`);const result=await response.json();if(typeof result.translatedText!=='string')throw Error('Resposta do tradutor sem translatedText.');translated=result.translatedText;}
 const text=protectedText.restore(translated);if(mechanicalSignature(original)!==mechanicalSignature(text))throw Error('Valores mecânicos alterados pelo serviço.');segments[original]=text;
 store.db.prepare('INSERT OR REPLACE INTO translation_cache VALUES(?,?,?)').run(cacheKey,JSON.stringify({translated}),new Date().toISOString());
 }
 if(sourceHash(store.record(record.id))!==before.sourceHash)throw Error('A fonte mudou durante a tradução.');
 return saveTranslation(store,record,{sourceHash:before.sourceHash,revision:before.revision,segments,automatic:true});
 }catch(e){const latest=getTranslation(store,record);if(latest.revision===before.revision)saveTranslation(store,record,{sourceHash:before.sourceHash,revision:before.revision,segments:{},failed:true,error:e.message});throw e;}
}
export function seedTranslations(store,path){if(!existsSync(path))return;for(const item of JSON.parse(readFileSync(path,'utf8')).records){const r=store.record(item.id);if(!r||sourceHash(r)!==item.sourceHash)continue;const current=getTranslation(store,r);if(current.revision)continue;saveTranslation(store,r,{sourceHash:current.sourceHash,revision:0,segments:item.segments});}}
