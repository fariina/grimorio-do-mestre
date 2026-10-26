import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('public/vendor',{recursive:true});await mkdir('.runtime',{recursive:true});
async function bytes(url){const r=await fetch(url);if(!r.ok)throw Error(`${r.status} ${url}`);return new Uint8Array(await r.arrayBuffer());}
const meta=await (await fetch('https://registry.npmjs.org/pdfjs-dist/latest')).json();
const version=meta.version;
const entries=[];
for(const [remote,local]of [['legacy/build/pdf.mjs','pdf.mjs'],['legacy/build/pdf.worker.mjs','pdf.worker.mjs'],['LICENSE','PDFJS-LICENSE.txt']]){const url=`https://unpkg.com/pdfjs-dist@${version}/${remote}`;const b=await bytes(url);await writeFile('public/vendor/'+local,b);entries.push({file:local,url,sha256:createHash('sha256').update(b).digest('hex')});}
await writeFile('public/vendor/manifest.json',JSON.stringify({name:'pdfjs-dist',version,license:'Apache-2.0',entries},null,2));
const npm=await(await fetch('https://registry.npmjs.org/npm/latest')).json();await writeFile('.runtime/npm.tgz',await bytes(npm.dist.tarball));
const pdfs=[['https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf','srd-5.2.1.pdf'],['https://www.dndbeyond.com/attachments/39j2li89/SRD5.1-CCBY4.0License.pdf','srd-5.1.pdf']];
const downloaded=[];for(const [url,name]of pdfs){try{const b=await bytes(url);await writeFile('reference/'+name,b);downloaded.push({name,url,sha256:createHash('sha256').update(b).digest('hex')});}catch(e){downloaded.push({name,url,error:e.message});}}
await writeFile('reference/documents.json',JSON.stringify(downloaded,null,2));
console.log(JSON.stringify({pdfjs:version,npm:npm.version,pdfs:downloaded},null,2));
