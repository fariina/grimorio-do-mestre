import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplication} from '../server.mjs';
test('HTTP: campanha → cena → teste → encontro → combate → recompensa → backup',async()=>{
 const app=createApplication({dbPath:':memory:',seed:false});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.server.address().port}`;let token;
 const request=async(path,data,method=data===undefined?'GET':'POST')=>{const r=await fetch(base+'/api'+path,{method,headers:{'Content-Type':'application/json','X-Grimorio-Token':token||''},...(data===undefined?{}:{body:JSON.stringify(data)})});const b=await r.json();assert.equal(r.ok,true,JSON.stringify(b));return b;};
 try{
 token=(await request('/bootstrap')).token;
 const denied=await fetch(base+'/api/campaigns',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(denied.status,403);
 const campaign=await request('/campaigns',{name:'Campanha do teste HTTP',data:{edition:'2024',sources:[],houseRules:'Sem dados reais'}});
 const scene=await request('/entities',{campaign_id:campaign.id,kind:'scene',name:'Cena de teste',data:{narration:'Texto de teste',secret:'Segredo de teste',links:[]}});
 const check=await request('/entities',{campaign_id:campaign.id,kind:'check',name:'Percepção teste',data:{sceneId:scene.id,dc:12,mode:'grupo',links:[scene.id]}});
 await request('/entities',{campaign_id:campaign.id,kind:'character',name:'Personagem teste',data:{level:1,maxHp:12,active:true}});
 const encounter=await request('/entities',{campaign_id:campaign.id,kind:'encounter',name:'Encontro teste',data:{sceneId:scene.id,monsters:[{name:'Criatura teste',cr:'1/4',maxHp:7,quantity:2,edition:'2024'}],links:[scene.id]}});
 const calc=await request('/difficulty',{edition:'2024',levels:[1],monsters:encounter.data.monsters});assert.equal(calc.multiplier,1);assert.equal(calc.total,100);
 const combat=await request('/combat/start',{encounterId:encounter.id});assert.equal(combat.data.participants.length,3);const pid=combat.data.participants[0].id;
 const hit=await request(`/combat/${combat.id}/action`,{revision:combat.revision,action:{type:'hp',id:pid,amount:-3}});assert.equal(hit.data.participants[0].hp,4);
 const undone=await request(`/entities/${combat.id}/undo`,{revision:hit.revision});assert.equal(undone.data.participants[0].hp,7);
 const table={name:'Tabela HTTP de teste',source:'Regra da casa de teste',edition:'caseiro',dice:'1',rows:[{min:1,max:1,coins:{po:'2'},rewards:[{name:'Arte de teste',kind:'arte'}]}]};assert.equal((await request('/treasure/validate',{table})).valid,true);const generation=await request('/treasure',{table});assert.equal(generation.coins.po,2);
 await request('/entities',{campaign_id:campaign.id,kind:'reward',name:'Recompensa teste',data:{encounterId:encounter.id,generation,delivered:true,recipients:'Grupo de teste',links:[encounter.id]}});
 const links=await request('/validate-links?campaignId='+campaign.id);assert.equal(links.broken.length,0);
 const preview=await request('/import/preview',{files:[{filename:'pessoal.md',content:'Notas de teste'},{filename:'registros.json',content:'{"spell":[{"name":"Spell HTTP","source":"XPHB","level":1,"entries":["2d6"]}]}'}],target:'library',edition:'2024'});assert.equal(preview.count,2);assert.equal((await request('/records')).total,0);await request('/import/apply',{previewId:preview.previewId});assert.equal((await request('/records')).total,2);
 const spell=(await request('/records?q=Spell')).results[0];await request(`/records/${spell.id}/annotation`,{revision:0,notes:'Nota de teste preservada',namePt:'Magia Áurea',status:'manual'},'PUT');assert.equal((await request('/records?q=magia aurea')).total,1);
 const batch=await request('/translation/export',{ids:[spell.id]});batch.records[0].textPt='2d6';batch.records[0].namePt='Magia Áurea';batch.records[0].status='revisada';const tp=await request('/translation/preview',{bundle:batch});assert.equal(tp.changes[0].warnings.length,0);assert.equal((await request('/translation/apply',{previewId:tp.previewId})).applied,1);
 const backup=await request('/backup');const bp=await request('/backup/preview',{backup});assert.equal(bp.campaigns,1);await request('/backup/restore',{previewId:bp.previewId,confirm:'RESTAURAR'});assert.equal((await request(`/campaigns/${campaign.id}/entities`)).some(x=>x.kind==='reward'&&x.data.delivered),true);assert.equal((await request(`/records/${spell.id}`)).annotation.notes,'Nota de teste preservada');
 const foreign=await fetch(base+'/api/campaigns',{method:'POST',headers:{'Content-Type':'application/json','X-Grimorio-Token':token,Origin:'http://evil.invalid'},body:'{}'});assert.equal(foreign.status,403);
 }finally{await new Promise(r=>app.server.close(r));app.store.close();}
});
