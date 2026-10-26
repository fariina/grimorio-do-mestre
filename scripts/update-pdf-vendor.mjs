import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const version='6.4.299';const entries=[];
for(const [remote,file]of [['legacy/build/pdf.mjs','pdf.mjs'],['legacy/build/pdf.worker.mjs','pdf.worker.mjs'],['LICENSE','PDFJS-LICENSE.txt']]){const url=`https://unpkg.com/pdfjs-dist@${version}/${remote}`;const r=await fetch(url);if(!r.ok)throw Error(String(r.status));const b=new Uint8Array(await r.arrayBuffer());await writeFile('public/vendor/'+file,b);entries.push({file,url,sha256:createHash('sha256').update(b).digest('hex')});}
await writeFile('public/vendor/manifest.json',JSON.stringify({name:'pdfjs-dist',version,license:'Apache-2.0',entries},null,2));
