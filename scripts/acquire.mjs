import {mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

// Único script que acessa a rede. Nunca lê campanhas, banco, notas ou livros locais.
const repo='5etools-mirror-3/5etools-src';
const api=`https://api.github.com/repos/${repo}`;
async function get(url){const r=await fetch(url,{headers:{'User-Agent':'GrimorioLocal-inventory'}});if(!r.ok)throw Error(`${r.status} ${url}`);return r.json();}
await mkdir('reference',{recursive:true});
const commit=(await get(`${api}/commits/main`)).sha;
const tree=(await get(`${api}/git/trees/${commit}?recursive=1`)).tree;
const root=tree.filter(x=>/^data\/[^/]+\.json$/.test(x.path)&&!/(fluff-|foundry-|changelog|converter|renderdemo|makebrew|makecards|monsterfeatures|msbcr|life|names|loot|encounterbuilder)/.test(x.path));
const indexed=tree.filter(x=>/^data\/(spells\/spells-[^/]+|bestiary\/bestiary-[^/]+|class\/class-[^/]+)\.json$/.test(x.path));
const paths=[...root,...indexed].map(x=>x.path);
const inventory={schemaVersion:1,checkedAt:new Date().toISOString(),repository:repo,commit,files:tree.filter(x=>x.path.startsWith('data/')).map(x=>({path:x.path,size:x.size||0,type:x.type})),categories:{},errors:[],licenseCode:'MIT (README; código não reutilizado)',licenseData:'Somente registros marcados srd/srd52 no upstream; CC-BY-4.0 SRD; sem imagens/fluff'};
const records=[];
const ignored=new Set(['_meta','_test','linkedLootTables','itemProperty','itemType','itemTypeAdditionalEntries','itemEntry','itemMastery']);
let done=0;
async function load(path){
 try{
 const obj=await get(`https://raw.githubusercontent.com/${repo}/${commit}/${path}`);
 for(const [key,arr] of Object.entries(obj)){
 if(!Array.isArray(arr)||ignored.has(key)||key.startsWith('_'))continue;
 const cat=inventory.categories[key]??={total:0,open:0,files:[],sources:{}};
 cat.total+=arr.length;cat.files.push(path);
 for(const row of arr){
 const src=row.source||row.id||'não informado';cat.sources[src]=(cat.sources[src]||0)+1;
 if(!row.name||(!row.srd&&!row.srd52))continue;
 // Exclui prosa ilustrativa/imagens e metadados de outras publicações.
 const {fluff,hasFluff,hasFluffImages,images,otherSources,additionalSources,reprintedAs,...clean}=row;
 const edition=row.edition==='one'||['XPHB','XDMG','XMM'].includes(row.source)||row.srd52?'2024':'2014';
 records.push({category:key,edition,source:row.source,name:row.name,raw:clean,license:'CC-BY-4.0',srdVersion:row.srd52?'5.2.1':'5.1',origin:`https://raw.githubusercontent.com/${repo}/${commit}/${path}`,importVersion:commit});
 cat.open++;
 }
 }
 }catch(e){inventory.errors.push({path,error:e.message});}
 done++;if(done%15===0)console.log(`Inventário ${done}/${paths.length}`);
}
// Concorrência limitada; documentos completos book/adventure não são baixados.
for(let i=0;i<paths.length;i+=6)await Promise.all(paths.slice(i,i+6).map(load));
const bundle={format:'grimorio-reference',version:1,importedAt:inventory.checkedAt,upstreamCommit:commit,records};
const json=JSON.stringify(bundle);
inventory.bundleSha256=createHash('sha256').update(json).digest('hex');
await writeFile('reference/open-srd.json',json);
await writeFile('reference/inventory.json',JSON.stringify(inventory,null,2));
console.log(JSON.stringify({commit,files:paths.length,records:records.length,categories:inventory.categories,errors:inventory.errors},null,2));
