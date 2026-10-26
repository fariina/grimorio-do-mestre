import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {stableId} from '../lib/catalog.mjs';
const b=JSON.parse(await readFile('reference/open-srd.json','utf8'));
const lookupUrl=`https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/${b.upstreamCommit}/data/generated/gendata-spell-source-lookup.json`;
const res=await fetch(lookupUrl);if(!res.ok)throw Error(String(res.status));const lookup=await res.json();let spells=0,corrections=0;
for(const r of b.records){
 r.id=stableId(r);
 if(['XPHB','XDMG','XMM'].includes(r.source)&&r.edition!=='2024'){r.edition='2024';corrections++;}
 if(r.category==='spell'){
 const classes=lookup[r.source.toLowerCase()]?.[r.name.toLowerCase()]?.class;
 const editionSource=r.edition==='2024'?'XPHB':'PHB';
 // Apenas a lista factual das classes básicas da edição correspondente.
 r.raw.classes=Object.keys(classes?.[editionSource]||{}).map(name=>({name,source:editionSource}));if(r.raw.classes.length)spells++;
 }
}
b.preparation={...b.preparation,spellClassLists:spells,editionCorrections:corrections,classLookup:lookupUrl};
const json=JSON.stringify(b);await writeFile('reference/open-srd.json',json);const inv=JSON.parse(await readFile('reference/inventory.json','utf8'));inv.bundleSha256=createHash('sha256').update(json).digest('hex');inv.preparation=b.preparation;await writeFile('reference/inventory.json',JSON.stringify(inv,null,2));console.log({spells,corrections,records:b.records.length});
