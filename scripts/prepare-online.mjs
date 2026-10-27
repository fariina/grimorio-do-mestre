import {readFileSync,writeFileSync,mkdirSync,copyFileSync,cpSync,existsSync} from 'node:fs';import {resolve,dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=join(root,'online');
function copy(from,to=from){const target=join(out,to);mkdirSync(dirname(target),{recursive:true});copyFileSync(join(root,from),target);}
for(const f of ['catalog','rules','combat','encounters','validation'])copy('lib/'+f+'.mjs');
for(const f of ['app.js','content.mjs','integration.js','style.css','integration.css','pdf-import.js','favicon.svg'])copy('public/'+f);
for(const f of ['inventory.json','translations-pt-br.json'])copy('reference/'+f);
for(const f of ['README.md','LICENSE'])copy(f,'public/docs/'+f);
for(const f of ['FONTES.md','COBERTURA.md','PUBLICACAO.md','HOSPEDAGEM-SITES.md'])copy('docs/'+f,'public/docs/'+f);
mkdirSync(join(out,'server'),{recursive:true});writeFileSync(join(out,'server/ui.mjs'),'export default '+JSON.stringify(readFileSync(join(root,'public/index.html'),'utf8'))+';\n');
const store=readFileSync(join(root,'lib/store.mjs'),'utf8'),body=store.match(/ validateBackup\(b\)\{([\s\S]*?)\n \}\n restore/);if(!body)throw Error('Contrato do validador de backup mudou; revisar a adaptação.');
writeFileSync(join(out,'server/backup-validation.mjs'),"import {normalizeRecord} from '../lib/catalog.mjs';\nimport {validateEntity} from '../lib/validation.mjs';\nimport {fail} from './utils.mjs';\nexport function validateBackup(b){"+body[1]+'\n}\n');
let ui=readFileSync(join(out,'public/app.js'),'utf8');
ui=ui.replace("state.boot?.auth?.mode==='github'","['github','sites'].includes(state.boot?.auth?.mode)");
ui=ui.replace("hosted()?button('Sair','logout','','small ghost'):''","hosted()?(state.boot.auth.mode==='sites'?'<a class=\"button small ghost\" href=\"/signout-with-chatgpt?return_to=/\" target=\"_top\">Sair</a>':button('Sair','logout','','small ghost')):''");
ui=ui.replace("hosted()?'Acesso pela sua conta GitHub'","hosted()?'Acesso pela sua conta ChatGPT'");
ui=ui.replace("hosted()?'Banco em DATA_DIR no servidor'","hosted()?'Banco D1 persistente do Sites'");
ui=ui.replace("${button('Exportar backup completo','export-backup','','primary')}","${button('Exportar backup completo','export-backup','','primary')}${button('Ver cópias do servidor','server-backups')}");
ui=ui.replace('uma cópia do estado atual será gravada na pasta backups','uma cópia do estado atual será gravada no armazenamento privado do servidor');
ui=ui.replace('transações e migrações de esquema v1/v2','transações e migrações versionadas');
ui=ui.replace('const actions={',`const actions={
 'server-backups':async()=>{const rows=await api('/server-backups');showModal('Cópias anteriores no servidor',rows.length?'<p>Cópias criadas antes de importar ou restaurar. Baixe e guarde também fora da hospedagem.</p>'+rows.map(x=>'<div class="entry-row"><div class="body"><b>'+h(new Date(x.createdAt).toLocaleString('pt-BR'))+'</b><p>'+h((x.bytes/1000000).toFixed(2))+' MB</p></div>'+button('Baixar','download-server-backup','data-id="'+h(x.id)+'"')+'</div>').join(''):empty('Nenhuma cópia anterior','As cópias aparecem após uma importação ou restauração.'));},
 'download-server-backup':async b=>{download('grimorio-anterior-'+b.dataset.id,await api('/server-backups/'+b.dataset.id));toast('Cópia anterior baixada.');},`);
writeFileSync(join(out,'public/app.js'),ui);
const pdf=join(out,'node_modules/pdfjs-dist');if(existsSync(pdf)){const dest=join(out,'public/vendor');mkdirSync(dest,{recursive:true});for(const f of ['pdf.mjs','pdf.worker.mjs'])copyFileSync(join(pdf,'legacy/build',f),join(dest,f));for(const f of ['cmaps','standard_fonts'])cpSync(join(pdf,f),join(dest,f),{recursive:true});copyFileSync(join(pdf,'LICENSE'),join(dest,'PDFJS-LICENSE.txt'));}
console.log('Código compartilhado e interface sincronizados; nenhum banco, livro ou backup copiado.');
