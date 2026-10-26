import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {fold,stableId} from '../lib/catalog.mjs';
const require=createRequire(new URL('../.runtime/tools/package.json',import.meta.url));
const canvas=require('@napi-rs/canvas');
for(const key of ['DOMMatrix','Path2D','ImageData'])globalThis[key]=canvas[key];
const pdfjs=await import('../public/vendor/pdf.mjs');
const b=JSON.parse(await readFile('reference/open-srd.json','utf8'));
// Idempotência: descarta somente as páginas geradas pelo próprio script.
b.records=b.records.filter(r=>r.origin!=='PDF oficial SRD');
const documents=JSON.parse(await readFile('reference/documents.json','utf8'));const pages=[],corpora={};
for(const [file,edition,source,version] of [['srd-5.2.1.pdf','2024','SRD52','5.2.1'],['srd-5.1.pdf','2014','SRD51','5.1']]){
 const data=new Uint8Array(await readFile('reference/'+file));
 const task=pdfjs.getDocument({data,isEvalSupported:false,enableXfa:false,useSystemFonts:false,cMapUrl:fileURLToPath(new URL('../public/vendor/cmaps/',import.meta.url)),cMapPacked:true,standardFontDataUrl:fileURLToPath(new URL('../public/vendor/standard_fonts/',import.meta.url))});
 const pdf=await task.promise;
 const parts=[];
 for(let n=1;n<=pdf.numPages;n++){
 const page=await pdf.getPage(n);const content=await page.getTextContent();let text='';for(const item of content.items)if(item.str!==undefined)text+=item.str+(item.hasEOL?'\n':' ');
 parts.push(text);if(text.trim())pages.push({name:`SRD ${version} — página PDF ${n}`,category:'book',source,edition,page:n,section:`Página física do PDF ${n}`,raw:{text,originalDocument:file,extraction:'Texto extraído localmente com PDF.js; conferir colunas/tabelas no PDF oficial'},license:'CC-BY-4.0',srdVersion:version,origin:'PDF oficial SRD',importVersion:documents.find(x=>x.name===file)?.sha256});page.cleanup();
 }
 corpora[edition]=fold(parts.join('\n')).replace(/\s+/g,' ');console.log(`${source}: ${pdf.numPages} páginas extraídas`);await task.destroy();
}
let previousExclusions=[];if(b.preparation)try{previousExclusions=JSON.parse(await readFile('reference/exclusions.json','utf8'));}catch{}
const exclusions=[...previousExclusions];let stripped=0;
b.records=b.records.filter(r=>{
 // Flags SRD não autorizam complementos editoriais de outras fontes.
 if(r.raw.additionalEntries){delete r.raw.additionalEntries;stripped++;}
 for(const key of ['hasToken','tokenCredit','soundClip','heightAndWeight','referenceSources','fluff','images','additionalSources','otherSources'])delete r.raw[key];
 const alias=typeof r.raw.srd52==='string'?r.raw.srd52:typeof r.raw.srd==='string'?r.raw.srd:r.name;
 const key=fold(alias).replace(/[’]/g,"'").replace(/\s+/g,' ');
 const corpus=corpora[r.edition].replace(/[’]/g,"'");
 if(!corpus.includes(key)){exclusions.push({name:r.name,alias,category:r.category,source:r.source,reason:'Nome não localizado automaticamente no PDF SRD da edição; não incluído no pacote inicial.'});return false;}
 return true;
});
const dedup=new Map();for(const r of [...b.records,...pages])dedup.set(stableId(r),r);
b.records=[...dedup.values()];b.preparation={...b.preparation,at:new Date().toISOString(),removedSupplementaryBlocks:(b.preparation?.removedSupplementaryBlocks||0)+stripped,excludedNames:exclusions.length,pdfPages:pages.length};
const json=JSON.stringify(b);await writeFile('reference/open-srd.json',json);await writeFile('reference/exclusions.json',JSON.stringify(exclusions,null,2));
const inv=JSON.parse(await readFile('reference/inventory.json','utf8'));inv.preparation=b.preparation;inv.bundleSha256=createHash('sha256').update(json).digest('hex');inv.actualBundleCounts={};for(const r of b.records)inv.actualBundleCounts[r.category]=(inv.actualBundleCounts[r.category]||0)+1;await writeFile('reference/inventory.json',JSON.stringify(inv,null,2));console.log(JSON.stringify({records:b.records.length,...b.preparation,exclusions:exclusions.slice(0,15)},null,2));
