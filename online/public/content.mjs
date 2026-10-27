// Camada única, sem acesso ao DOM: usada no servidor, biblioteca e participantes.
export const TERMS={
 str:'Força',dex:'Destreza',con:'Constituição',int:'Inteligência',wis:'Sabedoria',cha:'Carisma',strength:'Força',dexterity:'Destreza',constitution:'Constituição',intelligence:'Inteligência',wisdom:'Sabedoria',charisma:'Carisma',
 acrobatics:'Acrobacia','animal handling':'Lidar com Animais',arcana:'Arcanismo',athletics:'Atletismo',deception:'Enganação',history:'História',insight:'Intuição',intimidation:'Intimidação',investigation:'Investigação',medicine:'Medicina',nature:'Natureza',perception:'Percepção',performance:'Atuação',persuasion:'Persuasão',religion:'Religião','sleight of hand':'Prestidigitação',stealth:'Furtividade',survival:'Sobrevivência',
 darkvision:'Visão no escuro',blindsight:'Percepção às cegas',tremorsense:'Sentido sísmico',truesight:'Visão verdadeira',passive:'Passiva',
 common:'Comum',goblin:'Goblin',draconic:'Dracônico',elvish:'Élfico',dwarvish:'Anão',giant:'Gigante',gnomish:'Gnômico',halfling:'Halfling',orc:'Orc',abyssal:'Abissal',celestial:'Celestial',infernal:'Infernal',primordial:'Primordial',sylvan:'Silvestre',undercommon:'Subcomum',telepathy:'Telepatia',
 blinded:'Cego',charmed:'Enfeitiçado',deafened:'Surdo',exhaustion:'Exaustão',frightened:'Amedrontado',grappled:'Agarrado',incapacitated:'Incapacitado',invisible:'Invisível',paralyzed:'Paralisado',petrified:'Petrificado',poisoned:'Envenenado',prone:'Caído',restrained:'Contido',stunned:'Atordoado',unconscious:'Inconsciente',concentration:'Concentração',
 acid:'ácido',bludgeoning:'contundente',cold:'frio',fire:'fogo',force:'força',lightning:'elétrico',necrotic:'necrótico',piercing:'perfurante',poison:'veneno',psychic:'psíquico',radiant:'radiante',slashing:'cortante',thunder:'trovejante',
 walk:'Terrestre',fly:'Voo',swim:'Natação',climb:'Escalada',burrow:'Escavação',hover:'pairar','natural armor':'armadura natural',shield:'Escudo','leather armor':'Armadura de couro',scimitar:'Cimitarra',shortbow:'Arco curto',
 tiny:'Minúsculo',small:'Pequeno',medium:'Médio',large:'Grande',huge:'Enorme',gargantuan:'Imenso',humanoid:'humanoide',goblinoid:'goblinoide',dragon:'dragão',beast:'fera',undead:'morto-vivo',aberration:'aberração',celestial:'celestial',construct:'constructo',elemental:'elemental',fey:'feérico',fiend:'ínfero',giant:'gigante',monstrosity:'monstruosidade',ooze:'gosma',plant:'planta',
 disengage:'Desengajar',hide:'Esconder-se',dash:'Disparada',dodge:'Esquivar-se',help:'Ajudar',search:'Procurar',ready:'Preparar',attack:'Atacar','opportunity attack':'Ataque de oportunidade',
 name:'Nome',number:'Quantidade',condition:'Condição',note:'Observação',special:'Especial',from:'Origem',choose:'Escolha',amount:'Quantidade',type:'Tipo',tags:'Características',chance:'Chance',alignment:'Alinhamento',range:'Alcance',distance:'Distância',duration:'Duração',components:'Componentes',time:'Tempo',unit:'Unidade',feet:'pés',foot:'pé',mile:'milha',miles:'milhas',action:'ação',bonus:'ação bônus',reaction:'reação',minute:'minuto',hour:'hora',day:'dia',instant:'instantânea',point:'ponto',self:'pessoal',touch:'toque',unlimited:'ilimitado',permanent:'permanente',timed:'por tempo',
 'to hit':'para atingir','one target':'um alvo','two targets':'dois alvos','saving throw':'salvaguarda',damage:'dano','at will':'à vontade',daily:'Por dia',rest:'Por descanso',weekly:'Por semana',charges:'Cargas',spells:'Magias',will:'À vontade',constant:'Constante',ritual:'Ritual',headerEntries:'Descrição',footerEntries:'Notas',level:'Círculo',slots:'Espaços',
 'Nimble Escape':'Fuga Ágil',Multiattack:'Ataques múltiplos',Bite:'Mordida',Claw:'Garra',Tail:'Cauda',Detect:'Detectar',Bites:'Mordidas','Keen Smell':'Faro Aguçado',Swarm:'Enxame','Fire Breath':'Sopro de Fogo','Tail Attack':'Ataque de Cauda','Frightful Presence':'Presença Aterradora',
};
export const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function translate(s,ctx={}){
 s=String(s??'');if(ctx.original)return s;
 const segment=ctx.translation?.segments?.[s];if(segment)return typeof segment==='string'?segment:segment.text;
 const term=ctx.glossary?.find?.(x=>fold(x.term)===fold(s));if(term)return term.translation;
 const entry=Object.entries(TERMS).find(([k])=>fold(k)===fold(s));return entry?.[1]??s;
}
export function tokenize(s){
 s=String(s??'');const tokens=[];let at=0;
 while(at<s.length){const start=s.indexOf('{@',at);if(start<0){tokens.push({type:'text',value:s.slice(at)});break;}if(start>at)tokens.push({type:'text',value:s.slice(at,start)});let depth=1,end=start+2;
 for(;end<s.length&&depth;end++){if(s[end]==='{')depth++;else if(s[end]==='}')depth--;}
 if(depth){tokens.push({type:'invalid',value:s.slice(start+2)});break;}
 const raw=s.slice(start,end);const inner=raw.slice(2,-1);const match=inner.match(/^(\S+)(?:\s+([\s\S]*))?$/);tokens.push({type:'tag',tag:match?.[1]||'',body:match?.[2]||'',raw});at=end;
 }return tokens;
}
export function splitArgs(body){const out=[];let depth=0,word='';for(const c of body){if(c==='|'&&!depth){out.push(word);word='';continue;}if(c==='{')depth++;if(c==='}')depth--;word+=c;}out.push(word);return out;}
const REFS={spell:'spell',creature:'monster',item:'item',condition:'condition',status:'status',variantrule:'variantrule',feat:'feat',class:'class',race:'race',background:'background',skill:'skill',sense:'sense',action:'action',optfeature:'optionalfeature',hazard:'hazard',trap:'trap',book:'book',adventure:'adventure',table:'table',language:'language',deity:'deity',reward:'reward',object:'object',vehicle:'vehicle',psionic:'psionic'};
const ATK={mw:'Ataque corpo a corpo com arma',rw:'Ataque à distância com arma',ms:'Ataque mágico corpo a corpo',rs:'Ataque mágico à distância',m:'Ataque corpo a corpo',r:'Ataque à distância',w:'Ataque com arma',s:'Ataque mágico',g:'Agarrar',a:'Ataque de área',p:'Ataque com poder'};
const rollButton=(formula,label)=>`<button type="button" class="inline-roll" data-action="roll-inline" data-expression="${escape(formula)}">${label}</button>`;
export function renderMarkup(s,ctx={},depth=0){
 if(depth>20)return escape(s);
 const render=x=>renderMarkup(x,ctx,depth+1);
 return tokenize(translate(s,ctx)).map(t=>{
 if(t.type==='text')return escape(t.value);
 if(t.type==='invalid'){ctx.diagnostics?.({tag:'marcação incompleta',sample:t.value});return escape(t.value);}
 const p=splitArgs(t.body),first=p[0],tag=t.tag;
 if(REFS[tag])return `<button type="button" class="ref" data-action="reference-lookup" data-category="${REFS[tag]}" data-name="${escape(first)}" data-source="${escape(p[1]||'')}">${render(p[2]||translate(first,ctx))}</button>`;
 if(tag==='h')return '<b>Acerto:</b> ';
 if(tag==='hom')return '<b>Acerto ou erro:</b> ';
 if(tag==='m')return '<b>Erro:</b> ';
 if(tag==='atk'||tag==='atkr')return `<em>${escape(first.split(',').map(x=>ATK[x]||x.split('').map(k=>ATK[k]||k).join(' ')).join(' ou '))}${tag==='atkr'?' (rolagem)':''}:</em>`;
 if(tag==='hit'){const n=Number(first);return Number.isFinite(n)?rollButton(`1d20${n>=0?'+':''}${n}`,escape((n>=0?'+':'')+n)):escape(translate(first,ctx));}
 if(tag==='hitYourSpellAttack')return 'seu modificador de ataque mágico';
 if(['dice','damage','d20'].includes(tag)){const formula=tag==='d20'?`1d20${first.startsWith('-')||first.startsWith('+')?'':'+'}${first}`:first;return rollButton(formula,render(p[1]||first));}
 if(tag==='dc')return `<b>CD ${render(first)}</b>`;
 if(tag==='recharge')return rollButton('1d6',`Recarga ${escape(first||'6')}${first&&first!=='6'?'–6':''}`);
 if(tag==='chance')return rollButton('1d100',escape(p[1]||`${first}%`));
 const saves={actSave:'Salvaguarda de',actSaveFail:'Falha:',actSaveSuccess:'Sucesso:',actSaveSuccessOrFail:'Sucesso ou falha:',actSaveFailBy:'Falha por',actTrigger:'Gatilho:',actResponse:'Resposta:'};
 if(tag in saves)return `<b>${saves[tag]}${first?' '+render(tag==='actSave'?translate(first,ctx):first):''}</b>${tag==='actSave'&&p[1]?` (CD ${render(p[1])})`:''} `;
 if(['b','bold','i','italic','u','s','sup','sub','note','tip','cite'].includes(tag)){const el=({b:'b',bold:'b',i:'em',italic:'em',u:'u',s:'s',sup:'sup',sub:'sub',note:'small',tip:'span',cite:'cite'})[tag];return `<${el}>${render(first)}</${el}>`;}
 if(tag==='quickref')return render(p[4]||first);
 if(tag==='scaledice'||tag==='scaledamage')return rollButton(first,render(first))+(p.length>1?' <small>(progressão: '+p.slice(1).map(render).join(' · ')+')</small>':'');
 if(tag==='footnote')return render(first)+(p[1]?' <small>('+p.slice(1).map(render).join(' · ')+')</small>':'');
 if(['filter','link','5etools','loader'].includes(tag))return render(first);
 if(['at','hitOrMiss'].includes(tag))return render(first||'Acerto ou erro');
 ctx.diagnostics?.({tag,sample:t.raw});
 return p.map(render).filter(Boolean).join(' · ')||'<small>Conteúdo sem descrição reconhecida; consulte o diagnóstico.</small>';
 }).join('');
}
export function textFromHtml(s){return String(s).replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");}
export function plainMarkup(s,ctx={}){return renderMarkup(s,ctx).replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");}
const units=s=>String(s).replace(/\bft\./g,'pés').replace(/\bfeet\b/g,'pés').replace(/\bfoot\b/g,'pé');
const label=k=>TERMS[k]||k.replace(/([a-z])([A-Z])/g,'$1 $2');
export function formatValue(v,kind='',ctx={}){
 const text=x=>renderMarkup(translate(x,ctx),ctx);
 if(v==null)return '—';if(typeof v==='number')return String(v);if(typeof v==='boolean')return v?'Sim':'Não';
 if(typeof v==='string'){
 if(kind==='senses'||kind==='languages'){const m=v.match(/^(darkvision|blindsight|tremorsense|truesight|telepathy)\b(.*)$/i);if(m)return text(m[1])+escape(units(m[2]));}
 return text(v);
 }
 if(Array.isArray(v))return v.map(x=>formatValue(x,kind,ctx)).join(', ');
 if(kind==='speed')return Object.entries(v).filter(([k])=>!['canHover','alternate'].includes(k)).map(([k,x])=>{
 const value=typeof x==='number'?`${x} pés`:x===true?'igual ao deslocamento terrestre':x?.number!==undefined?`${escape(x.number)} pés${x.condition?' '+plainMarkup(x.condition,ctx):''}`:formatValue(x,'',ctx);
 return `${text(k)} ${value}${k==='fly'&&v.canHover?' (pairar)':''}`;
 }).concat(v.alternate?['Alternativo: '+formatValue(v.alternate,'speed',ctx)]:[]).join('; ');
 if(kind==='skill'||kind==='save')return Object.entries(v).map(([k,x])=>`${text(k)} ${formatValue(x,'',ctx)}`).join(', ');
 if(kind==='ac')return `${v.ac!==undefined?formatValue(v.ac,'',ctx):formatValue(v.special||'Especial','',ctx)}${v.from?.length?' ('+formatValue(v.from,'',ctx)+')':''}${v.condition?' '+text(v.condition):''}${v.braces?' (condicional)':''}`;
 if(kind==='type')return `${v.swarmSize?'enxame de criaturas '+formatSize([v.swarmSize],ctx)+' ':''}${text(v.type||'tipo não informado')}${v.tags?.length?' ('+v.tags.map(x=>typeof x==='string'?text(x):[x.prefix,text(x.tag)].filter(Boolean).join(' ')).join(', ')+')':''}`;
 for(const key of ['resist','immune','vulnerable','conditionImmune'])if(v[key])return [v.preNote?text(v.preNote):'',formatValue(v[key],key,ctx),v.note?text(v.note):'',v.cond?text(v.cond):''].filter(Boolean).join(' ');
 if(v.type==='cell'&&v.roll)return `${escape(v.roll.exact??v.roll.min)}${v.roll.max!==undefined?'–'+escape(v.roll.max):''}`;
 if(v.entry||v.entries||v.items)return renderEntry(v,ctx);
 return Object.entries(v).map(([k,x])=>`${text(label(k))}: ${formatValue(x,k,ctx)}`).join('; ');
}
export function formatSize(s,ctx={}){return (Array.isArray(s)?s:[s]).map(x=>translate(({T:'tiny',S:'small',M:'medium',L:'large',H:'huge',G:'gargantuan'})[x]||x||'não informado',ctx)).join(' ou ');}
export function alignment(v,ctx={}){const names={L:'ordeiro',N:'neutro',C:'caótico',G:'bom',E:'mau',U:'sem alinhamento',A:'qualquer alinhamento',NX:'neutro (eixo ordem)',NY:'neutro (eixo moral)'};if(!Array.isArray(v))return formatValue(v,'',ctx);return v.map(x=>typeof x==='string'?escape(names[x]||translate(x,ctx)):formatValue(x,'',ctx)).join(' ');}
export function renderEntry(v,ctx={},depth=0){
 if(v==null||depth>24)return '';if(typeof v==='string')return `<p>${renderMarkup(v,ctx)}</p>`;if(typeof v==='number')return String(v);if(Array.isArray(v))return v.map(x=>renderEntry(x,ctx,depth+1)).join('');
 const r=x=>renderEntry(x,ctx,depth+1),m=x=>renderMarkup(x,ctx);
 if(v.type==='table'||v.rows)return `${v.caption?`<h3>${m(v.caption)}</h3>`:''}<div class="table-wrap"><table>${v.colLabels?`<thead><tr>${v.colLabels.map(x=>`<th>${m(x)}</th>`).join('')}</tr></thead>`:''}<tbody>${(v.rows||[]).map(row=>`<tr>${(Array.isArray(row)?row:row.row||[]).map(x=>`<td>${typeof x==='object'?formatValue(x,'',ctx):m(String(x))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 if(v.items||v.type==='list')return `${v.name?`<h3>${m(v.name)}</h3>`:''}<ul>${(v.items||[]).map(x=>`<li>${typeof x==='string'?m(x):r(x)}</li>`).join('')}</ul>`;
 if(v.type==='hr')return '<hr>';
 if(v.type?.startsWith('ref'))return `<p>${m((v.classFeature||v.subclassFeature||v.name||'Referência relacionada').split('|')[0])}</p>`;
 const heading=v.name?`<h${depth>4?'4':'3'}>${m(v.name)}</h${depth>4?'4':'3'}>`:'';
 if(v.entries||v.entry||v.text||v.description||v.tables)return heading+r(v.entries||v.entry||v.text||v.description||v.tables);
 return heading+formatValue(Object.fromEntries(Object.entries(v).filter(([k])=>!['name','type','style'].includes(k))),'',ctx);
}
export function monsterModel(r,ctx={}){const v=r.raw||{};return {name:translate(r.name,ctx),ac:formatValue(v.ac,'ac',ctx),maxHp:v.hp?.average??null,hpFormula:v.hp?.formula,hpSpecial:v.hp?.special,speed:formatValue(v.speed,'speed',ctx),type:formatValue(v.type,'type',ctx),size:formatSize(v.size,ctx),alignment:alignment(v.alignment,ctx),skills:formatValue(v.skill,'skill',ctx),senses:formatValue(v.senses,'senses',ctx),languages:formatValue(v.languages,'languages',ctx),cr:v.cr?.cr??v.cr??'não informado'};}
export function renderRecordBody(r,ctx={}){
 const v=r.raw||{},m=x=>renderMarkup(x,ctx),f=(x,k)=>formatValue(x,k,ctx);let out='';
 if(r.category==='monster'){
 const model=monsterModel(r,ctx);out+=`<p class="muted">${escape(model.size)} · ${model.type} · ${model.alignment} · ND ${escape(model.cr)}</p><div class="details-grid"><div><b>CA</b> ${model.ac}</div><div><b>PV</b> ${v.hp?.average!==undefined?escape(v.hp.average):m(v.hp?.special||'não informado')} ${model.hpFormula?'('+rollButton(model.hpFormula,escape(model.hpFormula))+')':''}</div><div><b>Deslocamento</b> ${model.speed}</div><div><b>Percepção passiva</b> ${escape(v.passive??'não informada')}</div></div><div class="stats-grid">${['str','dex','con','int','wis','cha'].map(k=>{const n=Number(v[k]);return `<div class="stat"><b>${escape(translate(k,ctx))}</b><span>${Number.isFinite(n)?n:'—'}</span><small>${Number.isFinite(n)?(n>=10?'+':'')+Math.floor((n-10)/2):''}</small></div>`;}).join('')}</div>`;
 for(const [key,title]of [['save','Salvaguardas'],['skill','Perícias'],['vulnerable','Vulnerabilidades'],['resist','Resistências a dano'],['immune','Imunidades a dano'],['conditionImmune','Imunidades a condições'],['senses','Sentidos'],['languages','Idiomas']])if(v[key])out+=`<p><b>${title}:</b> ${f(v[key],key)}</p>`;
 for(const [key,title]of [['trait','Características'],['spellcasting','Conjuração'],['action','Ações'],['bonus','Ações bônus'],['reaction','Reações'],['legendary','Ações lendárias'],['mythic','Ações míticas']])if(v[key]){
 out+=`<h3>${title}</h3>`;for(const e of v[key]){out+=renderEntry({name:e.name,entries:e.entries||e.headerEntries||[]},ctx);if(key==='spellcasting')for(const [k,x]of Object.entries(e))if(!['name','headerEntries','footerEntries','type','ability','displayAs','hidden'].includes(k))out+=`<p><b>${escape(label(k))}:</b> ${f(x,'')}</p>`;if(e.footerEntries)out+=renderEntry(e.footerEntries,ctx);}
 }
 }else{
 if(r.category==='spell')out+=`<div class="details-grid">${[['Círculo',v.level===0?'Truque':v.level],['Escola',({A:'Abjuração',C:'Conjuração',D:'Adivinhação',E:'Encantamento',V:'Evocação',I:'Ilusão',N:'Necromancia',T:'Transmutação'})[v.school]],['Conjuração',v.time],['Alcance / área',v.range],['Componentes',v.components],['Duração',v.duration]].map(([k,x])=>`<div><b>${k}</b><br>${f(x,'')}</div>`).join('')}</div>`;
 if(['item','baseitem','magicvariant'].includes(r.category))out+=`<div class="details-grid">${[['Tipo',v.type],['Raridade',v.rarity],['Sintonização',v.reqAttune||'Não'],['Peso (lb, original)',v.weight],['Valor (pc, original)',v.value],['Propriedades',v.property]].map(([k,x])=>`<div><b>${k}</b><br>${f(x,'')}</div>`).join('')}</div>`;
 }
 out+=renderEntry(v.entries||v.text||v.description||[],ctx);if(v.entriesHigherLevel)out+=renderEntry(v.entriesHigherLevel,ctx);if(v.rows)out+=renderEntry(v,ctx);
 if(v.legendaryGroup)out+=`<p><b>Grupo lendário:</b> ${f(v.legendaryGroup.name,'')} · ${escape(v.legendaryGroup.source||r.source)}. As ações de covil/efeitos regionais do grupo precisam estar importados para consulta completa.</p>`;
 if(v.lairActions)out+='<h3>Ações de covil</h3>'+renderEntry(v.lairActions,ctx);
 if(v.regionalEffects)out+='<h3>Efeitos regionais</h3>'+renderEntry(v.regionalEffects,ctx);
 if(r.category==='class')out+=renderEntry((v.classTableGroups||[]).map(x=>({type:'table',caption:x.title,colLabels:['Nível',...(x.colLabels||[])],rows:(x.rows||[]).map((row,i)=>[i+1,...row])})),ctx);
 if(v._copy)out+='<div class="notice">Há herança de outra ficha ainda não resolvida. Revise a fonte antes de usar.</div>';
 return out||'<p class="muted">Sem descrição textual disponível.</p>';
}
// Apenas texto exibível; metadados, referências e valores estruturais não vão ao tradutor.
export function collectSegments(r){
 const result=new Set([r.name]);const walk=v=>{if(typeof v==='string'){if(/[A-Za-zÀ-ÿ]{2}/.test(plainMarkup(v)))result.add(v);return;}if(Array.isArray(v))return v.forEach(walk);if(v&&typeof v==='object'){for(const key of ['name','caption','entries','entry','items','rows','text','description','headerEntries','footerEntries'])if(v[key])walk(v[key]);if(v.spells)walk(v.spells);if(v.will)walk(v.will);if(v.daily)Object.values(v.daily).forEach(walk);}};
 const keys=['entries','text','description','trait','action','bonus','reaction','legendary','mythic','spellcasting','entriesHigherLevel'];keys.forEach(k=>walk(r.raw?.[k]));return [...result].filter(Boolean);
}
export function protectText(s,{glossary=[]}={}){
 const protectedValues=[];const token=v=>{const key=`ZXQ${protectedValues.length}QXZ`;protectedValues.push(v);return key;};
 let text=tokenize(s).map(x=>x.type==='tag'?token(x.raw):x.value).join('');
 for(const {term,translation} of [...glossary].sort((a,b)=>b.term.length-a.term.length))if(term.length>=3){const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');text=text.replace(new RegExp('\\b'+escaped+'\\b','gi'),()=>token(translation));}
 text=text.replace(/(?<![A-Za-z])(?:[+-]?\d+(?:[.,/]\d+)?(?:d\d+)?(?:\s*[+−-]\s*\d+)?)(?:\s*(?:ft\.|feet|foot|miles?|minutes?|hours?|rounds?))?/g,token);
 return {text,restore(translated){let output=String(translated);for(let i=0;i<protectedValues.length;i++){const key=`ZXQ${i}QXZ`;if(output.split(key).length!==2)throw Error('O tradutor alterou um marcador protegido.');output=output.replace(key,protectedValues[i]);}if(/ZXQ\d+QXZ/.test(output))throw Error('Marcador de tradução inesperado.');return output;}};
}
export function mechanicalSignature(s){return tokenize(s).filter(x=>x.type==='tag').map(x=>x.raw).sort().join('|')+'#'+String(s).replace(/\{@[^}]*\}/g,'').match(/[+-]?\d+(?:[.,/]\d+)?(?:d\d+)?/g)?.sort().join('|');}
