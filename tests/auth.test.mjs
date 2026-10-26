import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {deploymentConfig} from '../lib/deployment.mjs';import {createApplication} from '../server.mjs';
import {request as nodeRequest} from 'node:http';
import {readReference} from './reference.mjs';
function request(url,options={}){return new Promise((resolve,reject)=>{const req=nodeRequest(url,{method:options.method||'GET',headers:options.headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve(new Response(Buffer.concat(chunks),{status:res.statusCode,headers:Object.entries(res.headers).flatMap(([k,v])=>(Array.isArray(v)?v:[v]).filter(x=>x!==undefined).map(x=>[k,x]))})));});req.on('error',reject);if(options.body)req.write(options.body);req.end();});}
function config(dir,extra={}){return deploymentConfig({NODE_ENV:'production',AUTH_MODE:'github',HOST:'0.0.0.0',APP_ORIGIN:'https://grimorio.test',TRUST_PROXY:'true',GITHUB_OWNER_ID:'42',GITHUB_CLIENT_ID:'test-client',GITHUB_CLIENT_SECRET:'test-client-secret',SESSION_SECRET:'only-for-automated-test-'.repeat(3),DATA_DIR:dir,...extra});}
function cookie(response,name){return response.headers.getSetCookie().find(x=>x.startsWith(name+'='))?.split(';')[0]||'';}
const SESSION='__Host-grimorio_session',STATE='__Host-grimorio_oauth';
test('produção falha fechada sem OAuth/HTTPS/volume e não permite modo local público',()=>{
 assert.throws(()=>deploymentConfig({NODE_ENV:'production',AUTH_MODE:'local'}),/local/);
 assert.throws(()=>deploymentConfig({HOST:'0.0.0.0'}),/loopback/);
 assert.throws(()=>deploymentConfig({AUTH_MODE:'github'}),/APP_ORIGIN/);
 const dir=mkdtempSync(join(tmpdir(),'grimorio-config-'));try{assert.throws(()=>config(dir,{APP_ORIGIN:'http://grimorio.test'}),/HTTPS/);assert.throws(()=>config(dir,{GITHUB_OWNER_ID:''}),/GITHUB_OWNER_ID/);assert.throws(()=>config(dir,{GITHUB_CLIENT_SECRET:''}),/GITHUB_CLIENT_SECRET/);assert.throws(()=>config(dir,{SESSION_SECRET:'short'}),/SESSION_SECRET/);assert.throws(()=>config(dir,{DB_PATH:':memory:'}),/persistente/);assert.throws(()=>config(dir,{DB_PATH:join(dir,'..','ephemeral.sqlite')}),/DATA_DIR/);}finally{rmSync(dir,{recursive:true,force:true});}
 const separate=mkdtempSync(join(tmpdir(),'grimorio-config-'));try{assert.throws(()=>config(separate,{AUTH_DB_PATH:join(separate,'grimorio.sqlite')}),/diferente/);}finally{rmSync(separate,{recursive:true,force:true});}
});
test('OAuth: só o ID permitido entra; APIs, arquivos e backups bloqueados antes do login',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'grimorio-auth-'));let now=Date.now(),identityId=42,proof;
 const transport=async(url,opts)=>{if(url.endsWith('/access_token')){const input=JSON.parse(opts.body);assert.equal(input.redirect_uri,'https://grimorio.test/auth/callback');assert.equal(createHash('sha256').update(input.code_verifier).digest('base64url'),proof);return {ok:true,json:async()=>({access_token:'fake-token-for-test-only'})};}assert.equal(url,'https://api.github.com/user');assert.equal(opts.headers.Authorization,'Bearer fake-token-for-test-only');return {ok:true,json:async()=>({id:identityId,login:'same-name-cannot-bypass-id-check'})};};
 const app=createApplication({config:config(dir,{MAX_UPLOAD_BYTES:'1000000'}),seed:false,authOptions:{transport,clock:()=>now}});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.server.address().port}`;
 const req=(path,opts={})=>request(base+path,{...opts,headers:{Host:'grimorio.test','X-Forwarded-Proto':'https',...opts.headers}});
 async function login(){const start=await req('/auth/github');assert.equal(start.status,303);const target=new URL(start.headers.get('location'));assert.equal(target.hostname,'github.com');assert.equal(target.searchParams.get('code_challenge_method'),'S256');proof=target.searchParams.get('code_challenge');const nonce=cookie(start,STATE);assert.ok(nonce);const callback='/auth/callback?code=test-code&state='+target.searchParams.get('state');const result=await req(callback,{headers:{Cookie:nonce}});return {result,callback,nonce};}
 try{
 assert.equal((await req('/')).headers.get('location'),'/auth/login');assert.equal((await req('/auth/login')).status,200);assert.equal((await req('/healthz')).status,200);
 for(const path of ['/api/bootstrap','/api/records','/api/backup','/api/coverage','/api/glossary','/api/render-diagnostics','/api/translation/config','/reference/srd-5.1.pdf','/docs/README.md','/app.js']){const r=await req(path);assert.equal(r.status,401,path);const text=await r.text();assert.doesNotMatch(text,/SESSION_SECRET|client_secret|campaigns|records":/);}
 assert.equal((await req('/api/campaigns',{method:'POST',body:'{}'})).status,401);
 assert.equal((await req('/api/backup',{headers:{Host:'attacker.test'}})).status,403);
 assert.equal((await req('/api/backup',{headers:{'X-Forwarded-Proto':'http'}})).status,400);
 const owner=await login();assert.equal(owner.result.status,303);const sessionCookie=cookie(owner.result,SESSION);assert.ok(sessionCookie);const flags=owner.result.headers.getSetCookie().find(x=>x.startsWith(SESSION));assert.match(flags,/HttpOnly/);assert.match(flags,/Secure/);assert.match(flags,/SameSite=Lax/);assert.match(flags,/Path=\//);assert.doesNotMatch(flags,/Domain=/);
 const boot=await(await req('/api/bootstrap',{headers:{Cookie:sessionCookie}})).json();assert.equal(boot.auth.user.id,'42');assert.ok(boot.token);assert.doesNotMatch(JSON.stringify(boot),/test-client-secret|fake-token-for-test-only/);
 const headers={Cookie:sessionCookie,Origin:'https://grimorio.test','X-Grimorio-Token':boot.token,'Content-Type':'application/json'};
 assert.equal((await req('/api/campaigns',{method:'POST',headers:{...headers,Origin:'https://attacker.test'},body:'{}'})).status,403);
 assert.equal((await req('/api/campaigns',{method:'POST',headers:{...headers,'X-Grimorio-Token':'wrong'},body:'{}'})).status,403);
 assert.equal((await req('/api/import/preview',{method:'POST',headers,body:JSON.stringify({content:'a'.repeat(1_100_000)})})).status,413);
 const saved=await req('/api/campaigns',{method:'POST',headers,body:JSON.stringify({name:'Segredo do dono — teste',data:{edition:'2024'}})});assert.equal(saved.status,201);
 const backup=await(await req('/api/backup',{headers:{Cookie:sessionCookie}})).json();assert.equal(backup.data.campaigns.length,1);assert.equal(backup.data.sessions,undefined);assert.doesNotMatch(JSON.stringify(backup),/fake-token-for-test-only|only-for-automated-test/);
 const replay=await req(owner.callback,{headers:{Cookie:owner.nonce}});assert.equal(replay.status,400);
 identityId=43;const denied=await login();assert.equal(denied.result.status,403);assert.equal(cookie(denied.result,SESSION),'');assert.doesNotMatch(await denied.result.text(),/Segredo do dono/);
 const bad=await req('/auth/callback?code=test&state=invalid');assert.equal(bad.status,400);
 assert.equal((await req('/auth/logout',{method:'POST',headers})).status,200);assert.equal((await req('/api/backup',{headers:{Cookie:sessionCookie}})).status,401);
 identityId=42;const again=await login();const expiring=cookie(again.result,SESSION);now+=9*3600_000;assert.equal((await req('/api/records',{headers:{Cookie:expiring}})).status,401);
 }finally{await new Promise(r=>app.server.close(r));app.store.close();rmSync(dir,{recursive:true,force:true});}
});
test('sessões e dados sobrevivem à reinicialização; restauração de campanha não restaura credenciais',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'grimorio-restart-'));let app,base,sessionCookie,csrf;
 const transport=async(url)=>({ok:true,json:async()=>url.endsWith('/access_token')?{access_token:'ephemeral-test-token'}:{id:42,login:'owner-test'}});
 const start=async()=>{app=createApplication({config:config(dir),seed:false,authOptions:{transport}});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${app.server.address().port}`;};
 const req=(path,data)=>request(base+path,{method:data?'POST':'GET',headers:{Host:'grimorio.test','X-Forwarded-Proto':'https',Origin:'https://grimorio.test',Cookie:sessionCookie||'','X-Grimorio-Token':csrf||'','Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
 try{
 await start();const auth=await req('/auth/github');const u=new URL(auth.headers.get('location'));sessionCookie=cookie(auth,STATE);const logged=await req('/auth/callback?code=test&state='+u.searchParams.get('state'));sessionCookie=cookie(logged,SESSION);const boot=await(await req('/api/bootstrap')).json();csrf=boot.token;
 const post=async(path,data)=>{const r=await req(path,data),v=await r.json();assert.equal(r.ok,true,JSON.stringify(v));return v;};
 const c=await post('/api/campaigns',{name:'Campanha persistente teste',data:{edition:'2014'}});
 const scene=await post('/api/entities',{campaign_id:c.id,kind:'scene',name:'Cena de teste',data:{narration:'Narrativa de teste',secret:'Segredo de teste'}});
 const check=await post('/api/entities',{campaign_id:c.id,kind:'check',name:'Teste preparado',data:{sceneId:scene.id,dc:12,skill:'Percepção',success:'Pista de teste',failure:'Consequência de teste'}});
 const goblin=readReference().records.find(r=>r.name==='Goblin'&&r.source==='MM');
 const preview=await post('/api/import/preview',{filename:'srd-test.json',content:JSON.stringify({records:[goblin]})});await post('/api/import/apply',{previewId:preview.previewId});
 let encounter=await post('/api/entities',{campaign_id:c.id,kind:'encounter',name:'Encontro persistente',data:{sceneId:scene.id}});
 encounter=await post(`/api/encounters/${encounter.id}/add`,{revision:encounter.revision,recordId:goblin.id,quantity:3});
 encounter=await post(`/api/participants/${encounter.id}/action`,{revision:encounter.revision,action:{type:'hp',id:encounter.data.participants[1].id,amount:-3}});
 const combat=await post('/api/combat/start',{encounterId:encounter.id});assert.deepEqual(combat.data.participants.map(x=>x.hp),[7,4,7]);
 await post('/api/entities',{campaign_id:c.id,kind:'reward',name:'Recompensa teste',data:{encounterId:encounter.id,delivered:true,links:[encounter.id]}});
 const backup=await(await req('/api/backup')).json();
 await new Promise(r=>app.server.close(r));app.store.close();await start();const next=await(await req('/api/bootstrap')).json();assert.equal(next.token,csrf);assert.equal(next.campaigns[0].id,c.id);
 const entities=await(await req(`/api/campaigns/${c.id}/entities`)).json();assert.equal(entities.find(x=>x.id===check.id).data.sceneId,scene.id);assert.deepEqual(entities.find(x=>x.id===combat.id).data.participants.map(x=>x.hp),[7,4,7]);
 const p=await post('/api/backup/preview',{backup});assert.ok(p.previewId);assert.equal((await req('/api/backup/restore',{previewId:p.previewId,confirm:'RESTAURAR'})).status,200);assert.equal((await req('/api/backup')).status,200);assert.deepEqual(app.store.entity(combat.id).data.participants.map(x=>x.id),combat.data.participants.map(x=>x.id));
 }finally{if(app?.server.listening)await new Promise(r=>app.server.close(r));app?.store.close();rmSync(dir,{recursive:true,force:true});}
});
