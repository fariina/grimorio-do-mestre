import {readdirSync,readFileSync,statSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,relative,resolve} from 'node:path';
import {createHash} from 'node:crypto';
// Lista positiva: nenhum diretório pessoal é enumerado para publicação.
const roots=['lib','public','scripts','tests','docs'];
const fixed=['server.mjs','package.json','package-lock.json','README.md','LICENSE','CHECKLIST.md','Iniciar.cmd','.gitignore','.dockerignore','.env.example','.env.production.example','Dockerfile','render.yaml','reference/inventory.json','reference/documents.json','reference/translations-pt-br.json','reference/exclusions.json'];
const allowedVendor=new Set(['public/vendor/manifest.json','public/vendor/PDFJS-LICENSE.txt']);
const files=[];
function walk(path){for(const item of readdirSync(path,{withFileTypes:true})){if(item.isSymbolicLink())throw Error('Link simbólico não permitido no pacote de publicação.');const file=join(path,item.name).replaceAll('\\','/');if(file.startsWith('public/vendor/')&&!allowedVendor.has(file)&&!item.isDirectory())continue;if(item.isDirectory()){if(file==='public/vendor'){for(const name of allowedVendor)if(existsSync(name))files.push(name);}else walk(file);}else files.push(file);}}
roots.forEach(root=>{if(existsSync(root))walk(root);});fixed.forEach(file=>{if(existsSync(file))files.push(file);});
const paths=[...new Set(files)].sort();
const denied=/^(?:data|backups|imports|node_modules|\.runtime|\.git|\.codex|\.aws|\.agents)(?:\/|$)|(?:^|\/)\.env(?:$|\.)|\.(?:sqlite(?:-wal|-shm)?|pem|key|p12|pfx|log|bak|dump|zip|tgz)$/i;
const secrets=/(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16})/;
const entries=paths.map(path=>{if(denied.test(path)&&!['.env.example','.env.production.example'].includes(path))throw Error('Caminho privado detectado: '+path);const content=readFileSync(path,'utf8');if(content.includes('\u0000'))throw Error('Binário inesperado: '+path);if(secrets.test(content))throw Error('Possível credencial detectada em '+path);return {path,mode:'100644',type:'blob',content};});
const manifest={version:1,createdAt:new Date().toISOString(),files:entries.map(e=>({path:e.path,bytes:Buffer.byteLength(e.content),sha256:createHash('sha256').update(e.content).digest('hex')})),excluded:['data/','backups/','imports/','.env e segredos','.runtime/','node_modules/','pacote JSON derivado da biblioteca','PDFs e livros','assets PDF.js gerados (obtidos por npm ci)']};
mkdirSync('.runtime/release',{recursive:true});writeFileSync('.runtime/release/manifest.json',JSON.stringify(manifest,null,2));writeFileSync('.runtime/release/tree.json',JSON.stringify(entries));
if(process.argv.includes('--tree'))process.stdout.write(JSON.stringify(entries));else console.log(JSON.stringify({files:entries.length,bytes:manifest.files.reduce((sum,f)=>sum+f.bytes,0),manifest:'.runtime/release/manifest.json',privatePaths:0,secretsDetected:0}));
