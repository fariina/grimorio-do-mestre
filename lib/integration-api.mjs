import {randomUUID} from 'node:crypto';
import {upgradeEncounter,addFromLibrary,changeEncounter,monsterSummary,instantiate,sourceHash} from './encounters.mjs';
import {changeCombat,combatant} from './combat.mjs';
import {getTranslation,saveTranslation,translateRecord,translationConfig,seedTranslations} from './translation.mjs';
import {collectSegments,translate} from '../public/content.mjs';
import {references} from './catalog.mjs';
const error=(message,status=400)=>{throw Object.assign(Error(message),{status});};
export function prepareEntity(store,e){
 if(!e)return null;
 if(['encounter','combat'].includes(e.kind)&&e.data.participantVersion!==2){e=store.transaction(()=>store.saveEntity(upgradeEncounter(e,id=>store.record(id))));}
 const copy=structuredClone(e);
 for(const p of copy.data.participants||[])if(p.snapshot){
 p.snapshot.translation=getTranslation(store,p.snapshot);
 const current=store.record(p.recordId);if(current&&sourceHash(current)===p.origin?.sourceHash)p.snapshot.annotation=current.annotation;
 }
 return copy;
}
export function initializeIntegration(store,root){
 seedTranslations(store,root+'/reference/translations-pt-br.json');
 if(!store.db.prepare('SELECT 1 FROM imports WHERE id=?').get('glossary-search-v1'))store.transaction(()=>{const glossary=store.db.prepare('SELECT term,translation FROM glossary').all();for(const row of store.db.prepare('SELECT id,name FROM records').all())if(translate(row.name,{glossary})!==row.name)store.index(row.id);store.db.prepare('INSERT INTO imports VALUES(?,?,?,?)').run('glossary-search-v1','Índice de nomes do glossário','{}',new Date().toISOString());});
 for(const row of store.db.prepare("SELECT id FROM entities WHERE kind IN ('encounter','combat')").all())prepareEntity(store,store.entity(row.id));
}
export async function integrationApi({store,path,method,input,url}){
 let m;const ok=body=>({status:200,body});
 const owner=id=>{const e=prepareEntity(store,store.entity(id));if(!e||!['encounter','combat'].includes(e.kind))error('Encontro ou combate não encontrado.',404);return e;};
 const revision=(e)=>{if(input.revision!==e.revision)error('O encontro foi alterado em outra aba. Recarregue antes de continuar.',409);};
 if(path==='/api/entities'&&method==='POST'&&['encounter','combat'].includes(input.kind))return ok(store.transaction(()=>store.saveEntity(upgradeEncounter(input,id=>store.record(id)))));
 if((m=path.match(/^\/api\/campaigns\/([^/]+)\/entities$/))&&method==='GET')return ok(store.entities(m[1]).map(e=>prepareEntity(store,e)));
 if((m=path.match(/^\/api\/encounters\/([^/]+)$/))&&method==='GET')return ok(owner(m[1]));
 if((m=path.match(/^\/api\/encounters\/([^/]+)\/add$/))&&method==='POST'){
 const e=owner(m[1]);revision(e);if(e.kind!=='encounter')error('Adicione criaturas em um encontro preparado.');
 const record=store.record(input.recordId);if(!record||record.category!=='monster')error('Monstro não encontrado na biblioteca.');
 const c=store.campaign(e.campaign_id),sources=[...(c.data.sources||[]),...(c.data.supplements||[])];
 const outside=record.edition!==c.data.edition&&(record.edition!=='caseiro'||!c.data.allowHomebrew)||sources.length&&!sources.includes(record.source)&&record.edition!=='caseiro';
 if(outside&&!input.confirmOutside)error(`A ficha é ${record.edition}, fonte ${record.source}, fora das preferências da campanha. Confirme explicitamente a inclusão sem alterar sua edição.`,409);
 const next=store.transaction(()=>store.saveEntity(addFromLibrary(e,record,Number(input.quantity),input.maxHp?{maxHp:Number(input.maxHp)}:{})));
 return ok(prepareEntity(store,next));
 }
 if((m=path.match(/^\/api\/participants\/([^/]+)\/action$/))&&method==='POST'){
 const e=owner(m[1]);revision(e);let next;
 if(input.action.type==='add-custom'){
 const {quantity=1,...custom}=input.action.participant;if(!Number.isInteger(quantity)||quantity<1||quantity>100)error('Quantidade de 1 a 100.');
 next=structuredClone(e);for(let i=1;i<=quantity;i++)next.data.participants.push(instantiate(null,{...custom,number:i,name:custom.name+' '+i,maxHp:Number(custom.maxHp)}));next.data.monsters=monsterSummary(next.data.participants);
 }else if(e.kind==='encounter')next=changeEncounter(e,input.action);
 else next={...e,data:changeCombat(e.data,input.action)};
 return ok(prepareEntity(store,store.transaction(()=>store.saveEntity(next))));
 }
 if((m=path.match(/^\/api\/participants\/([^/]+)\/([^/]+)\/record$/))&&method==='GET'){
 const e=owner(m[1]),p=e.data.participants.find(x=>x.id===m[2]);if(!p?.snapshot)error('Este participante usa uma ficha personalizada sem modelo de biblioteca.');
 const r=structuredClone(p.snapshot);r.references=references(r).map(ref=>({...ref,ids:store.db.prepare('SELECT id FROM records WHERE lower(name)=lower(?) AND lower(source)=lower(?) AND edition=?').all(ref.name,ref.source,r.edition).map(x=>x.id)}));r.alternatives=[];r.participantName=p.name;r.instance={id:p.id,hp:p.hp,maxHp:p.maxHp,tempHp:p.tempHp,initiative:p.initiative,conditions:p.conditions,notes:p.notes};r.snapshotNotice=p.origin?.migratedSnapshot?'Ficha vinculada na migração: o formato antigo não guardava uma cópia histórica. Os valores e ajustes existentes foram preservados.':'Cópia da ficha usada neste encontro. Atualizações da biblioteca não substituem esta versão.';return ok(r);
 }
 if(path==='/api/combat/start'&&method==='POST'){
 const e=owner(input.encounterId),c=store.campaign(e.campaign_id);
 if(e.data.participants.some(p=>p.edition&&p.edition!==c.data.edition)&&!input.allowMixed)error('Há participantes de outra edição. Confirme a combinação para este combate.');
 const participants=structuredClone(e.data.participants);for(const p of store.entities(e.campaign_id).filter(x=>x.kind==='character'&&x.data.active!==false))if(!participants.some(x=>x.characterId===p.id))participants.push(combatant({name:p.name,characterId:p.id,maxHp:Number(p.data.maxHp)||10,side:'ally',initiativeBonus:Number(p.data.initiativeBonus)||0,group:'Personagens'}));
 return ok(store.saveEntity({campaign_id:e.campaign_id,kind:'combat',name:`Combate — ${e.name}`,data:{participantVersion:2,encounterId:e.id,round:1,turn:0,participants,log:[{at:new Date().toISOString(),note:'Combate iniciado com os participantes e ajustes preparados.'}]}}));
 }
 if((m=path.match(/^\/api\/entities\/([^/]+)\/duplicate$/))&&method==='POST'){
 const e=prepareEntity(store,store.entity(m[1]));if(!e)error('Elemento não encontrado.',404);const data=structuredClone(e.data);if(data.participants)data.participants.forEach(p=>{p.id=randomUUID();});
 return ok(store.saveEntity({campaign_id:e.campaign_id,kind:e.kind,name:input.name||e.name+' (cópia)',data:{...data,template:!!input.template}}));
 }
 if(path==='/api/library/attach'&&method==='POST'){
 const r=store.record(input.recordId),c=store.campaign(input.campaignId);if(!r||!c)error('Selecione uma campanha e um registro válidos.');if(r.category==='monster')error('Use Adicionar ao encontro para criar participantes.');
 const target=input.targetId?store.entity(input.targetId):null;if(target&&target.campaign_id!==c.id)error('O destino pertence a outra campanha.');
 const item=['item','baseitem','magicvariant'].includes(r.category),spell=r.category==='spell';
 const saved=store.saveEntity({campaign_id:c.id,kind:item?'inventory':spell?'spelllist':'document',name:(item?'Inventário — ':spell?'Magia — ':'Referência rápida — ')+(r.annotation.namePt||r.name),data:{body:r.name+' — '+r.source+' ('+r.edition+')',recordId:r.id,snapshot:r,sourceVersion:sourceHash(r),quantity:item?Number(input.quantity||1):undefined,targetId:target?.id,referenceType:item?'item':spell?'spell':'rule',links:[r.id,...(target?[target.id]:[])]}});
 return ok(saved);
 }
 if(path==='/api/translation/config')return ok(translationConfig());
 if((m=path.match(/^\/api\/records\/([^/]+)\/translation$/))){
 const r=store.record(m[1]);if(!r)error('Registro não encontrado.',404);
 if(method==='GET')return ok({...getTranslation(store,r),originals:collectSegments(r),recordName:r.name});
 if(method==='PUT')return ok(store.transaction(()=>saveTranslation(store,r,input)));
 if(method==='POST')return ok(await translateRecord(store,r,input));
 }
 if(path==='/api/render-diagnostics'&&method==='GET')return ok(store.db.prepare('SELECT * FROM render_diagnostics ORDER BY last_seen DESC LIMIT 100').all());
 if(path==='/api/render-diagnostics'&&method==='POST'){for(const item of (input.items||[]).slice(0,100))store.db.prepare('INSERT INTO render_diagnostics VALUES(?,?,1,?) ON CONFLICT(tag) DO UPDATE SET count=count+1,last_seen=excluded.last_seen').run(String(item.tag).slice(0,100),String(item.sample).slice(0,1000),new Date().toISOString());return ok({saved:true});}
 return null;
}
