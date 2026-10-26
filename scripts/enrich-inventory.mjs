import {readFile,writeFile} from 'node:fs/promises';
const inv=JSON.parse(await readFile('reference/inventory.json','utf8'));
for(const path of ['data/generated/gendata-tables.json','data/loot.json','data/magicvariants.json','data/items-base.json']){
 const url=`https://raw.githubusercontent.com/${inv.repository}/${inv.commit}/${path}`;
 const r=await fetch(url);if(!r.ok)throw Error(String(r.status));const obj=await r.json();
 inv.auxiliary??={};inv.auxiliary[path]={url,keys:Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,Array.isArray(v)?v.length:typeof v]))};
 if(path.endsWith('magicvariants.json')){const rows=obj.magicvariant;inv.categories.magicvariant={total:rows.length,open:rows.filter(x=>x.srd||x.srd52||x.inherits?.srd||x.inherits?.srd52).length,files:[path],sources:rows.reduce((out,x)=>{const k=x.source||x.inherits?.source||'não informada';out[k]=(out[k]||0)+1;return out;},{}),note:'Flags de licença também podem estar em inherits. Variantes estruturadas ainda dependem de revisão; o texto SRD está disponível nos PDFs.'};}
 if(path.endsWith('items-base.json'))for(const [key,rows]of Object.entries(obj)){if(key==='baseitem'||!Array.isArray(rows)||key.startsWith('_'))continue;inv.categories[key]={total:rows.length,open:rows.filter(x=>x.srd||x.srd52).length,files:[path],sources:{},note:'Metadados auxiliares de equipamentos; importáveis com o arquivo local.'};}
 if(path.includes('gendata-tables'))for(const [key,rows]of Object.entries(obj)){
 if(!Array.isArray(rows))continue;const cat=inv.categories[key]??={total:0,open:0,files:[],sources:{}};
 if(cat.files.includes(path))continue;cat.files.push(path);cat.total+=rows.length;for(const row of rows){const src=row.source||'não informada';cat.sources[src]=(cat.sources[src]||0)+1;}cat.note='Inclui tabelas extraídas dos livros pelo upstream; não distribuídas automaticamente.';
 }
}
await writeFile('reference/inventory.json',JSON.stringify(inv,null,2));console.log(inv.auxiliary);
