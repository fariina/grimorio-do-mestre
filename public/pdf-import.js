// Extração local com PDF.js. Nenhuma ação ou JavaScript do documento é executado.
export async function extractPdf(file,{target='library',onProgress=()=>{}}={}){
 const pdfjs=await import('/vendor/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc='/vendor/pdf.worker.mjs';
 const loading=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,enableXfa:false,useSystemFonts:false,cMapUrl:'/vendor/cmaps/',cMapPacked:true,standardFontDataUrl:'/vendor/standard_fonts/'});
 let pdf;try{pdf=await loading.promise;}catch(e){throw Error('PDF ilegível ou protegido. Exporte texto com seu leitor autorizado. '+e.message);}
 if(pdf.numPages>2000){await loading.destroy();throw Error('Limite de 2.000 páginas por PDF. Divida o arquivo.');}
 const records=[],entities=[];let empty=0;
 for(let n=1;n<=pdf.numPages;n++){
 const page=await pdf.getPage(n);const text=await page.getTextContent();const lines=[];let line='';
 for(const item of text.items){if(!('str'in item))continue;line+=item.str+(item.hasEOL?'\n':' ');if(item.hasEOL){lines.push(line.trimEnd());line='';}}if(line)lines.push(line.trimEnd());const body=lines.join('\n').trim();
 if(!body){empty++;continue;}const name=`${file.name} — página ${n}`;
 if(target==='campaign')entities.push({kind:'document',name,data:{body,page:n,originalFile:file.name,extraction:'PDF.js — revisão necessária',links:[]}});
 else records.push({name,category:'book',page:n,section:`PDF página ${n}`,raw:{name,text:body,originalFile:file.name,extraction:'PDF.js — revisão necessária'}});
 onProgress(n,pdf.numPages);page.cleanup();
 }
 await loading.destroy();if(!records.length&&!entities.length)throw Error('PDF sem texto extraível. Use OCR local.');
 return {filename:file.name+'.json',content:JSON.stringify(target==='campaign'?{entities}:{records}),warning:`${file.name}: texto sem imagens; ${empty} páginas sem texto. Revise colunas, tabelas, símbolos e números.`};
}
