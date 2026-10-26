import {createHash} from 'node:crypto';
import {plainMarkup} from '../public/content.mjs';

export const CATEGORIES={spell:'Magias',monster:'Monstros',race:'Espécies / raças',subrace:'Subespécies',class:'Classes',subclass:'Subclasses',classFeature:'Características de classe',subclassFeature:'Características de subclasse',background:'Antecedentes',feat:'Talentos',item:'Itens mágicos e equipamentos',baseitem:'Equipamentos básicos',magicvariant:'Variantes mágicas',optionalfeature:'Características opcionais',charoption:'Opções de personagem',condition:'Condições',disease:'Doenças',status:'Estados',action:'Ações',variantrule:'Regras e glossário',table:'Tabelas',tableGroup:'Grupos de tabelas',book:'Livros',adventure:'Aventuras',vehicle:'Veículos',vehicleUpgrade:'Melhorias de veículos',object:'Objetos',trap:'Armadilhas',hazard:'Perigos',reward:'Recompensas',cult:'Cultos',boon:'Dádivas',deity:'Divindades',language:'Idiomas',languageScript:'Escritas',skill:'Perícias',sense:'Sentidos',psionic:'Psiônicos',recipe:'Receitas',homecraft:'Ofícios',facility:'Bastiões / instalações',deck:'Baralhos',card:'Cartas',encounter:'Tabelas de encontros',itemProperty:'Propriedades de itens',itemType:'Tipos de itens',itemEntry:'Regras de equipamentos',itemMastery:'Maestrias de armas',note:'Documentos pessoais',rule:'Regras importadas',treasureTable:'Tabelas de tesouro'};
export const fold=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const stableId=r=>r.id||createHash('sha256').update([r.category,r.name,r.source,r.edition,r.raw?.className,r.raw?.subclassShortName,r.raw?.level,r.section].join('|').toLowerCase()).digest('hex').slice(0,32);
export function plain(value){
 if(value==null)return '';
 if(typeof value==='string')return plainMarkup(value,{original:true});
 if(Array.isArray(value))return value.map(plain).filter(Boolean).join('\n');
 if(typeof value==='object')return [value.name,value.caption,plain(value.entries||value.entry||value.items||value.rows||value.text)].filter(Boolean).join('\n');
 return String(value);
}
export function recordText(raw){
 const keys=['entries','entriesHigherLevel','additionalEntries','trait','action','bonus','reaction','legendary','mythic','spellcasting','rows','description','text','entriesTemplate','items'];
 return keys.map(k=>plain(raw[k])).filter(Boolean).join('\n\n');
}
export function normalizeRecord(input,defaults={}){
 if(!input||typeof input!=='object')throw Error('Registro inválido.');
 const raw=input.raw||input;
 if(input.id!==undefined&&(typeof input.id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_.:@-]{0,199}$/.test(input.id)))throw Error('Identificador inválido. Use letras ASCII, números, ponto, _, :, @ ou hífen, com até 200 caracteres.');
 const category=input.category||defaults.category||'note';
 const name=input.name||raw.name||raw.caption||defaults.name;
 if(typeof name!=='string'||!name.trim()||name.length>500)throw Error('Cada registro precisa de um nome com até 500 caracteres.');
 const source=input.source||raw.source||raw.inherits?.source||defaults.source||'Pessoal';
 const edition=['2024','2014','caseiro'].includes(input.edition)?input.edition:(raw.edition==='one'||/^X(PHB|DMG|MM|Screen|SAC)$/.test(source)?'2024':raw.edition==='classic'||['PHB','MM','DMG'].includes(source)?'2014':defaults.edition||'não identificada');
 const r={category,name,source,edition,page:input.page??raw.page??null,section:input.section||null,raw,namePt:input.namePt||'',textPt:input.textPt||'',translationStatus:input.translationStatus||'original',license:input.license||defaults.license||'fornecido pelo usuário',origin:input.origin||defaults.origin||'importação local',importVersion:input.importVersion||defaults.importVersion||'local-v1',srdVersion:input.srdVersion||null};
 r.id=stableId({...r,id:input.id});r.text=recordText(raw);
 const cr=raw.cr?.cr??raw.cr;
 r.facets={level:raw.level,school:raw.school,classes:raw.classes,concentration:raw.duration?.some(x=>x.concentration)||false,ritual:!!raw.meta?.ritual,cr:typeof cr==='string'||typeof cr==='number'?String(cr):'',type:typeof raw.type==='object'?raw.type.type:raw.type,size:raw.size,environment:raw.environment,rarity:raw.rarity,attunement:!!raw.reqAttune,property:raw.property};
 return r;
}
export function references(r){
 const refs=[];const s=JSON.stringify(r.raw);let m;
 const cats={creature:'monster',spell:'spell',item:'item',condition:'condition',variantrule:'variantrule',class:'class',race:'race',feat:'feat',background:'background',skill:'skill',sense:'sense',action:'action',book:'book',adventure:'adventure',optfeature:'optionalfeature'};
 const re=/\{@(creature|spell|item|condition|variantrule|class|race|feat|background|skill|sense|action|book|adventure|optfeature) ([^{}]+)\}/g;
 while((m=re.exec(s))){const [name,src]=m[2].split('|');refs.push({category:cats[m[1]],name,source:src||(['condition','variantrule','skill','action','race','class','spell','feat','background'].includes(m[1])?(r.edition==='2024'?'XPHB':'PHB'):m[1]==='creature'?(r.edition==='2024'?'XMM':'MM'):m[1]==='item'?(r.edition==='2024'?'XDMG':'DMG'):'')});}
 for(const key of ['classFeatures','subclassFeatures'])for(const v of (r.raw[key]||[]).flat(Infinity)){const uid=typeof v==='string'?v:v?.classFeature;if(uid){const p=uid.split('|');refs.push({category:key==='classFeatures'?'classFeature':'subclassFeature',name:p[0],source:p[2]||r.source,className:p[1],level:p[key==='classFeatures'?3:5]});}}
 return [...new Map(refs.map(x=>[JSON.stringify(x),x])).values()];
}

export function parseImport({filename='conteudo.json',content,edition='não identificada',source='Pessoal',license='fornecido pelo usuário',target='library'}){
 if(typeof content!=='string'||content.length>45_000_000)throw Error('Arquivo ausente ou maior que 45 MB.');
 const warnings=[];let records=[];let entities=[];
 if(/\.pdf$/i.test(filename))throw Error('PDF binário não é extraído nesta instalação. Exporte texto/Markdown com seu leitor de PDF. PDFs escaneados exigem OCR local.');
 if(/\.(md|txt)$/i.test(filename)){
 if(target==='campaign')entities=[{kind:'document',name:filename.replace(/\.[^.]+$/,''),data:{body:content,secret:'',links:[]}}];
 else records=[normalizeRecord({name:filename.replace(/\.[^.]+$/,''),raw:{text:content},category:'note'},{source,edition,license})];
 }else{
 let obj;try{obj=JSON.parse(content.replace(/^\uFEFF/,''));}catch{throw Error('JSON inválido. Verifique a sintaxe.');}
 if(target==='campaign'){
 const list=Array.isArray(obj)?obj:obj.entities;
 if(!Array.isArray(list))throw Error('Campanha JSON deve conter entities: [{kind,name,data}].');
 const kinds=new Set(['character','npc','faction','location','quest','clue','timeline','journal','document','scene','check','encounter','reward','session']);
 entities=list.map(x=>{if(!kinds.has(x.kind)||typeof x.name!=='string'||!x.data||typeof x.data!=='object'||Array.isArray(x.data))throw Error('Elemento de campanha inválido.');return {id:x.id,kind:x.kind,name:x.name,data:x.data};});
 }else{
 const defaults={source,edition,license,origin:filename};
 if(Array.isArray(obj.individual)&&Array.isArray(obj.hoard)){
 for(const kind of ['individual','hoard','dragon'])for(const row of obj[kind]||[]){const prefix={individual:'Tesouro individual',hoard:'Acumulado de tesouro',dragon:'Tesouro de dragão'}[kind];records.push(normalizeRecord({name:`${prefix} — ${row.name}`,source:row.source,category:'treasureTable',raw:{engine:'5etools-loot',kind,root:row,support:{gems:obj.gems||[],artObjects:obj.artObjects||[],magicItems:obj.magicItems||[],dragonMundaneItems:obj.dragonMundaneItems||[]}},page:row.page},defaults));}
 warnings.push('Tabelas de tesouro 5etools: moedas, gemas, arte e itens são resolvidos localmente. Escolhas não probabilísticas ou estruturas desconhecidas exigem decisão manual, indicada no resultado. Nenhuma fonte é presumida como aberta.');
 }
 else if(Array.isArray(obj)||Array.isArray(obj.records))records=(Array.isArray(obj)?obj:obj.records).map(r=>normalizeRecord(r,defaults));
 else if(Array.isArray(obj.data)){
 // 5etools: livro/aventura completo. Cada seção é consultável, preservando a árvore.
 records=obj.data.map((r,i)=>normalizeRecord({name:r.name||`${filename} — seção ${i+1}`,category:'book',section:String(i+1),raw:r},defaults));
 }else for(const [category,arr]of Object.entries(obj)){
 if(category.startsWith('_')||!Array.isArray(arr))continue;
 if(!CATEGORIES[category])warnings.push(`Categoria adicional preservada: ${category}`);
 for(const row of arr){if(!row||typeof row!=='object'||!(row.name||row.caption||row.inherits?.name))continue;records.push(normalizeRecord({...row,name:row.name||row.caption||row.inherits?.name,category},defaults));}
 }
 }
 }
 if(records.length+entities.length===0)throw Error('Nenhum registro reconhecido. Use JSON 5etools, records ou entities, Markdown ou texto.');
 if(records.length+entities.length>30000)throw Error('Máximo de 30.000 registros por lote.');
 const seen=new Set();for(const r of records){if(seen.has(r.id))warnings.push(`Identificador repetido no arquivo: ${r.name}`);seen.add(r.id);if(r.raw._copy)warnings.push(`Herança a resolver: ${r.name} → ${r.raw._copy.name}`);}
 return {records,entities,warnings:[...new Set(warnings)],filename};
}
