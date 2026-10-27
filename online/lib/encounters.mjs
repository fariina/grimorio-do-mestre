import {randomUUID,createHash} from 'node:crypto';
import {combatant,changeCombat} from './combat.mjs';
import {monsterModel} from '../public/content.mjs';
export const sourceHash=r=>createHash('sha256').update(JSON.stringify({name:r.name,raw:r.raw,source:r.source,edition:r.edition})).digest('hex');
export function instantiate(record,{number=1,...overrides}={}){
 const snapshot=record?structuredClone(record):null;
 const model=record?monsterModel(record):null;
 const maxHp=overrides.maxHp??model?.maxHp;
 if(!Number.isFinite(maxHp)||maxHp<1)throw Error('Esta ficha exige informar PV máximos antes de adicionar.');
 return combatant({name:`${record?.annotation?.namePt||record?.name||overrides.name||'Criatura'} ${number}`,number,customName:false,recordId:record?.id||null,
 origin:record?{recordId:record.id,sourceHash:sourceHash(record),version:record.importVersion,importedAt:record.importedAt,source:record.source,edition:record.edition}:null,
 snapshot,maxHp,ac:record?.raw?.ac||overrides.ac||[],cr:record?.facets?.cr??record?.raw?.cr?.cr??record?.raw?.cr??overrides.cr,
 initiativeBonus:Math.floor(((record?.raw?.dex||10)-10)/2),edition:record?.edition,source:record?.source,notes:'',...overrides});
}
export function upgradeEncounter(e,loadRecord){
 const next=structuredClone(e);if(next.data.participantVersion===2)return next;
 if(e.kind==='combat'){
 next.data.participants=(next.data.participants||[]).map(p=>{
 if(p.snapshot||!p.recordId)return p;const r=loadRecord(p.recordId);if(!r)return p;
 const fresh=instantiate(r,{number:1,maxHp:p.maxHp});return {...fresh,...p,snapshot:fresh.snapshot,origin:{...fresh.origin,migratedSnapshot:true},customName:true};
 });
 }else{
 const count=new Map();next.data.participants=(next.data.participants||[]);
 for(const m of next.data.monsters||[]){const r=m.recordId?loadRecord(m.recordId):null;const key=m.recordId||m.name;for(let i=0;i<m.quantity;i++){const n=(count.get(key)||0)+1;count.set(key,n);const p=instantiate(r,{...m,number:n,maxHp:m.maxHp||r?.raw.hp?.average||1,name:`${m.name} ${n}`,notes:m.notes||'',group:m.name});if(p.origin)p.origin.migratedSnapshot=true;next.data.participants.push(p);}}
 }
 next.data.participantVersion=2;
 // A lista antiga é mantida como histórico de migração; não orienta os novos cards.
 next.data.legacyMonsters=next.data.monsters||next.data.legacyMonsters||[];
 next.data.monsters=monsterSummary(next.data.participants);
 return next;
}
export function monsterSummary(participants=[]){return participants.map(p=>({name:p.name,quantity:1,cr:p.cr??p.snapshot?.facets?.cr??'',...(p.xp!==undefined?{xp:p.xp}:{}),maxHp:p.maxHp,recordId:p.recordId,edition:p.edition||p.origin?.edition,source:p.source||p.origin?.source,side:p.side||'enemy',countForMultiplier:p.countForMultiplier!==false}));}
export function addFromLibrary(e,record,quantity,options={}){
 if(!Number.isInteger(quantity)||quantity<1||quantity>100)throw Error('Informe quantidade inteira de 1 a 100.');
 const next=structuredClone(e);next.data.participants??=[];
 if(next.data.participants.length+quantity>500)throw Error('Máximo de 500 participantes no encontro.');
 const existing=next.data.participants.filter(p=>p.recordId===record.id);const start=Math.max(0,...existing.map(p=>p.number||0));
 for(let i=1;i<=quantity;i++)next.data.participants.push(instantiate(record,{number:start+i,...options}));
 next.data.participantVersion=2;next.data.monsters=monsterSummary(next.data.participants);return next;
}
export function changeEncounter(e,action){
 const next=structuredClone(e);const state={round:1,turn:0,participants:next.data.participants||[],log:next.data.participantLog||[]};
 if(action.type==='duplicate'){
 const old=state.participants.find(x=>x.id===action.id);if(!old)throw Error('Participante não encontrado.');
 const n=Math.max(0,...state.participants.filter(p=>p.recordId===old.recordId).map(p=>p.number||0))+1;
 const copy=structuredClone(old);copy.id=randomUUID();copy.number=n;copy.name=old.customName?`${old.name} (cópia)`:`${old.snapshot?.name||old.group||'Criatura'} ${n}`;state.participants.push(copy);state.log.push({at:new Date().toISOString(),note:'Participante duplicado: '+copy.name});
 }else{
 if(action.type==='patch'&&action.patch?.name!==undefined)action={...action,patch:{...action.patch,customName:true}};
 const changed=changeCombat(state,action);state.participants=changed.participants;state.log=changed.log;
 }
 next.data.participants=state.participants;next.data.participantLog=state.log;next.data.monsters=monsterSummary(state.participants);return next;
}
