import {resolve,relative,isAbsolute,join} from 'node:path';
const loopback=host=>['127.0.0.1','localhost','::1','[::1]'].includes(host);
export function deploymentConfig(env=process.env){
 const production=env.NODE_ENV==='production'||env.RENDER==='true';
 const mode=env.AUTH_MODE||(production?'github':'local');
 if(!['local','github'].includes(mode))throw Error('AUTH_MODE deve ser local ou github.');
 const host=env.HOST||(production?'0.0.0.0':'127.0.0.1');
 if(mode==='local'&&(production||!loopback(host)))throw Error('O modo local só pode escutar em loopback e não pode ser usado em produção.');
 let origin=null;const value=env.APP_ORIGIN||env.RENDER_EXTERNAL_URL;
 if(mode==='github'){
 try{origin=new URL(value);}catch{throw Error('Defina APP_ORIGIN com a URL HTTPS pública da aplicação.');}
 if(origin.protocol!=='https:'||origin.username||origin.password||origin.search||origin.hash||origin.pathname!=='/')throw Error('APP_ORIGIN precisa ser uma origem HTTPS, sem caminho, credenciais ou parâmetros.');
 if(!/^[1-9]\d*$/.test(env.GITHUB_OWNER_ID||''))throw Error('Defina GITHUB_OWNER_ID com o ID numérico da única conta autorizada.');
 if(!env.GITHUB_CLIENT_ID||!env.GITHUB_CLIENT_SECRET)throw Error('Configure GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET nos segredos da hospedagem.');
 if((env.SESSION_SECRET||'').length<32)throw Error('SESSION_SECRET precisa ter pelo menos 32 caracteres aleatórios.');
 }
 const dataDir=resolve(env.DATA_DIR||'data');
 if(production&&(!env.DATA_DIR||!isAbsolute(env.DATA_DIR)))throw Error('Produção exige DATA_DIR absoluto em um volume persistente.');
 const dbPath=env.DB_PATH||join(dataDir,'grimorio.sqlite');
 const authDbPath=env.AUTH_DB_PATH||join(dataDir,'auth.sqlite');
 if(mode==='github'&&resolve(dbPath)===resolve(authDbPath))throw Error('AUTH_DB_PATH deve ser diferente de DB_PATH para separar credenciais e campanhas.');
 const backupDir=resolve(env.BACKUP_DIR||(mode==='github'?join(dataDir,'backups'):'backups'));
 const inside=file=>{const rel=relative(dataDir,resolve(file));return rel!==''&&!rel.startsWith('..')&&!isAbsolute(rel);};
 if(mode==='github'&&(dbPath===':memory:'||authDbPath===':memory:'||!inside(dbPath)||!inside(authDbPath)||!inside(backupDir)))throw Error('Banco, sessões e backups precisam ficar dentro de DATA_DIR persistente.');
 const maxBytes=Number(env.MAX_UPLOAD_BYTES||60_000_000);if(!Number.isInteger(maxBytes)||maxBytes<1_000_000||maxBytes>200_000_000)throw Error('MAX_UPLOAD_BYTES inválido (1 a 200 MB).');
 return {production,mode,host,origin:origin?.origin,ownerId:env.GITHUB_OWNER_ID,clientId:env.GITHUB_CLIENT_ID,clientSecret:env.GITHUB_CLIENT_SECRET,sessionSecret:env.SESSION_SECRET,trustProxy:env.TRUST_PROXY==='true',dataDir,dbPath,authDbPath,backupDir,maxBytes,sessionTtl:8*60*60_000};
}
