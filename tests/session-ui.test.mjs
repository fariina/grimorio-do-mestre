import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {createApplication} from '../server.mjs';import * as Content from '../public/content.mjs';
async function jsdom(){try{return(await import('jsdom')).JSDOM;}catch{return(await import('../.runtime/tools/node_modules/jsdom/lib/api.js')).JSDOM;}}
test('sessão expirada mantém a edição na tela e retoma o salvamento com o novo token',async()=>{
 const JSDOM=await jsdom();const app=createApplication({dbPath:':memory:',seed:false});
 const c=app.store.saveCampaign({name:'Campanha de teste de sessão',data:{edition:'2024'}});
 const scene=app.store.saveEntity({campaign_id:c.id,kind:'scene',name:'Nome anterior',data:{}});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.server.address().port}`;
 const dom=new JSDOM(readFileSync('public/index.html','utf8'),{url:base+'/#scenes',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 let expired=false,renewed=false,realToken='',usedNewToken=false;
 // Simula apenas a expiração na interface; OAuth e cookies reais são exercitados em auth.test.mjs.
 w.fetch=async(path,opts={})=>{
 if(expired)return new Response(JSON.stringify({error:'Sessão expirada.'}),{status:401,headers:{'Content-Type':'application/json'}});
 const headers={...opts.headers};if(headers['X-Grimorio-Token']==='renewed-token-test'){headers['X-Grimorio-Token']=realToken;usedNewToken=true;}
 const r=await fetch(new URL(path,base),{...opts,headers});
 if(path==='/api/bootstrap'&&r.ok){const data=await r.json();realToken=data.token;return new Response(JSON.stringify({...data,token:renewed?'renewed-token-test':realToken,auth:{mode:'github',user:{id:'42',login:'owner-test'}}}),{headers:{'Content-Type':'application/json'}});}return r;
 };
 w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.crypto.randomUUID=()=>crypto.randomUUID();w.Content=Content;
 const wait=async(fn)=>{const deadline=Date.now()+6000;while(!fn()){if(Date.now()>deadline)throw Error('Tempo de espera esgotado: '+w.document.querySelector('#toasts').textContent);await new Promise(r=>setTimeout(r,20));}};
 try{
 w.eval(readFileSync('public/integration.js','utf8').replace('export function installIntegration','window.installIntegration = function installIntegration'));w.eval(readFileSync('public/app.js','utf8').replace(/^import .*;$/gm,''));
 await wait(()=>w.document.querySelector(`[data-action=edit-entity][data-id="${scene.id}"]`));assert.match(w.document.querySelector('.sidebar-footer').textContent,/ACESSO PESSOAL/);assert.ok(w.document.querySelector('[data-action=logout]'));
 w.document.querySelector(`[data-action=edit-entity][data-id="${scene.id}"]`).click();await wait(()=>w.document.querySelector('#entityForm'));
 expired=true;const input=w.document.querySelector('#entityForm [name=name]');input.value='Minha edição preservada';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 await wait(()=>w.document.querySelector('#sessionWarning'));assert.equal(input.value,'Minha edição preservada');assert.equal(app.store.entity(scene.id).name,'Nome anterior');assert.ok(w.document.querySelector('#modal').open);assert.equal(w.document.querySelector('#sessionWarning a').target,'_blank');
 expired=false;renewed=true;w.document.querySelector('[data-action=renew-session]').click();await wait(()=>app.store.entity(scene.id).name==='Minha edição preservada');assert.equal(usedNewToken,true);assert.equal(w.document.querySelector('#sessionWarning'),null);assert.equal(input.value,'Minha edição preservada');assert.match(w.document.querySelector('#saveStatus').textContent,/servidor/);
 }finally{dom.window.close();await new Promise(r=>app.server.close(r));app.store.close();}
});
