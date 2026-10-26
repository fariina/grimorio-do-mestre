import {DatabaseSync} from 'node:sqlite';
import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
const random=()=>randomBytes(32).toString('base64url');
const secureEqual=(a,b)=>{const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&timingSafeEqual(x,y);};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SESSION='__Host-grimorio_session',STATE='__Host-grimorio_oauth';
function cookies(req){const result={};for(const piece of (req.headers.cookie||'').split(';')){const i=piece.indexOf('=');if(i>0)result[piece.slice(0,i).trim()]=piece.slice(i+1).trim();}return result;}
function cookie(name,value,maxAge){return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function redirect(res,path,extra={}){res.writeHead(303,{Location:path,'Cache-Control':'no-store',...extra});res.end();}
function page(res,status,title,message,action=true){res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · Grimório</title><link rel="stylesheet" href="/auth/style.css"><main><span class="eyebrow">GRIMÓRIO DO MESTRE · ACESSO PESSOAL</span><h1>${escape(title)}</h1><p>${escape(message)}</p>${action?'<a class="primary" href="/auth/github">Entrar com GitHub</a>':''}<small>Somente a conta autorizada pelo proprietário pode acessar os dados.</small></main></html>`);}
export class Auth{
 constructor(config,{transport=fetch,clock=()=>Date.now()}={}){
 this.config=config;this.transport=transport;this.clock=clock;this.attempts=new Map();
 if(config.mode==='github'){
 mkdirSync(dirname(config.authDbPath),{recursive:true});this.db=new DatabaseSync(config.authDbPath);
 if(this.db.prepare('PRAGMA user_version').get().user_version>1){this.db.close();throw Error('Banco de sessões de uma versão mais recente. Atualize a aplicação.');}
 this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,login TEXT NOT NULL,csrf TEXT NOT NULL,expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS oauth_states(state_hash TEXT PRIMARY KEY,cookie_hash TEXT NOT NULL,verifier TEXT NOT NULL,expires_at INTEGER NOT NULL);
 PRAGMA user_version=1;`);
 }
 }
 hash(value){return createHmac('sha256',this.config.sessionSecret).update(value).digest('hex');}
 purge(){if(this.db){this.db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(this.clock());this.db.prepare('DELETE FROM oauth_states WHERE expires_at<=?').run(this.clock());}}
 close(){this.db?.close();}
 hostAllowed(req){if(this.config.mode==='local')return /^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(req.headers.host||'');return req.headers.host===new URL(this.config.origin).host;}
 secure(req){return !!req.socket.encrypted||(this.config.trustProxy&&req.headers['x-forwarded-proto']==='https');}
 session(req){if(!this.db)return null;this.purge();const raw=cookies(req)[SESSION];if(!raw||!/^[A-Za-z0-9_-]{43}$/.test(raw))return null;const row=this.db.prepare('SELECT * FROM sessions WHERE token_hash=?').get(this.hash(raw));return row&&row.user_id===this.config.ownerId&&row.expires_at>this.clock()?row:null;}
 async intercept(req,res,url){
 const path=url.pathname,method=req.method;
 if(path==='/healthz'&&['GET','HEAD'].includes(method)){json(res,200,{status:'ok'});return {handled:true};}
 if(!this.hostAllowed(req)){json(res,403,{error:'Host não autorizado.'});return {handled:true};}
 if(this.config.mode==='local')return {handled:false,session:null};
 res.setHeader('Strict-Transport-Security','max-age=31536000');
 if(!this.secure(req)){json(res,400,{error:'Esta instância exige HTTPS pelo proxy configurado.'});return {handled:true};}
 const session=this.session(req);
 if(path==='/auth/style.css'&&method==='GET'){res.writeHead(200,{'Content-Type':'text/css; charset=utf-8','Cache-Control':'no-store'});res.end('html{color-scheme:dark;font:16px/1.65 system-ui;background:#101317;color:#e5e6e8}body{margin:0;display:grid;place-items:center;min-height:100vh}main{max-width:520px;margin:24px;padding:36px;border:1px solid #38423d;border-radius:14px;background:#171e1b}h1{font:36px Georgia,serif;color:#e8c58e}.eyebrow{font-size:11px;letter-spacing:2px;color:#c8ab78}.primary{display:inline-block;background:#dfba80;padding:12px 20px;color:#1a1712;border-radius:7px;text-decoration:none;margin:15px 0}small{display:block;color:#abb6ac;margin-top:18px}');return {handled:true};}
 if(path==='/auth/status'&&method==='GET'){json(res,200,{authenticated:!!session,...(session?{login:session.login}:{})});return {handled:true};}
 if(path==='/auth/login'&&method==='GET'){if(session)redirect(res,'/');else page(res,200,'Seu grimório, só seu','Entre com sua conta GitHub para abrir campanhas, biblioteca e backups.');return {handled:true};}
 if(path==='/auth/github'&&method==='GET'){
 const ip=req.socket.remoteAddress||'unknown',now=this.clock();const hits=(this.attempts.get(ip)||[]).filter(x=>now-x<600_000);if(hits.length>=20){res.setHeader('Retry-After','600');json(res,429,{error:'Muitas tentativas de login. Aguarde alguns minutos.'});return {handled:true};}hits.push(now);this.attempts.set(ip,hits);if(this.attempts.size>1000)this.attempts.clear();
 this.purge();const state=random(),nonce=random(),verifier=random();
 this.db.prepare('INSERT INTO oauth_states VALUES(?,?,?,?)').run(this.hash(state),this.hash(nonce),verifier,now+600_000);
 const target=new URL('https://github.com/login/oauth/authorize');target.search=new URLSearchParams({client_id:this.config.clientId,redirect_uri:this.config.origin+'/auth/callback',scope:'read:user',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256',allow_signup:'false'});
 redirect(res,target.href,{'Set-Cookie':cookie(STATE,nonce,600)});return {handled:true};
 }
 if(path==='/auth/callback'&&method==='GET'){
 const state=url.searchParams.get('state')||'',code=url.searchParams.get('code')||'',nonce=cookies(req)[STATE]||'';
 const row=/^[A-Za-z0-9_-]{43}$/.test(state)?this.db.prepare('SELECT * FROM oauth_states WHERE state_hash=?').get(this.hash(state)):null;
 res.setHeader('Set-Cookie',cookie(STATE,'',0));
 if(!row||row.expires_at<=this.clock()||!secureEqual(row.cookie_hash,this.hash(nonce))||!code||code.length>2048){page(res,400,'Login não confirmado','A tentativa expirou ou não pertence a este navegador. Inicie o login novamente.');return {handled:true};}
 this.db.prepare('DELETE FROM oauth_states WHERE state_hash=?').run(this.hash(state));
 try{
 const response=await this.transport('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({client_id:this.config.clientId,client_secret:this.config.clientSecret,code,redirect_uri:this.config.origin+'/auth/callback',code_verifier:row.verifier})});
 if(!response.ok)throw Error('exchange');const access=await response.json();if(!access.access_token||typeof access.access_token!=='string')throw Error('token');
 const result=await this.transport('https://api.github.com/user',{headers:{Authorization:`Bearer ${access.access_token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10','User-Agent':'Grimorio-do-Mestre'},signal:AbortSignal.timeout(15000)});
 if(!result.ok)throw Error('identity');const identity=await result.json();
 if(String(identity.id)!==this.config.ownerId){page(res,403,'Conta sem acesso','Esta conta GitHub não é a conta autorizada para este grimório.',false);return {handled:true};}
 if(session)this.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(session.token_hash);
 const raw=random(),csrf=random();this.db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?)').run(this.hash(raw),String(identity.id),String(identity.login||'proprietário'),csrf,this.clock()+this.config.sessionTtl);
 // O token GitHub foi usado apenas para comprovar a identidade e não é persistido.
 redirect(res,'/',{'Set-Cookie':[cookie(STATE,'',0),cookie(SESSION,raw,Math.floor(this.config.sessionTtl/1000))]});return {handled:true};
 }catch{page(res,502,'Não foi possível entrar','O GitHub não confirmou a autenticação. Tente novamente; nenhum dado da campanha foi enviado.');return {handled:true};}
 }
 if(!session){if(path==='/'&&method==='GET')redirect(res,'/auth/login');else json(res,401,{error:'Entre na sua conta para acessar este conteúdo.'});return {handled:true};}
 if(!['GET','HEAD'].includes(method)){
 if(req.headers.origin!==this.config.origin||!secureEqual(req.headers['x-grimorio-token'],session.csrf)){json(res,403,{error:'Origem ou token de sessão inválido. Reabra a aplicação.'});return {handled:true};}
 }
 if(path==='/auth/logout'&&method==='POST'){this.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(session.token_hash);res.setHeader('Set-Cookie',cookie(SESSION,'',0));json(res,200,{loggedOut:true});return {handled:true};}
 res.setHeader('Cache-Control','private, no-store');return {handled:false,session};
 }
}
