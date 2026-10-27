import {normalizeRecord} from '../lib/catalog.mjs';
import {validateEntity} from '../lib/validation.mjs';
import {fail} from './utils.mjs';
export function validateBackup(b){
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
