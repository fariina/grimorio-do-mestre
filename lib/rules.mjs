import {randomInt} from 'node:crypto';
export const SOURCE_2024='https://www.dndbeyond.com/sources/dnd/br-2024/dms-toolbox';
export const SOURCE_2014='https://www.dndbeyond.com/sources/dnd/basic-rules-2014/building-combat-encounters';
export const BUDGET_2024=[[50,75,100],[100,150,200],[150,225,400],[250,375,500],[500,750,1100],[600,1000,1400],[750,1300,1700],[1000,1700,2100],[1300,2000,2600],[1600,2300,3100],[1900,2900,4100],[2200,3700,4700],[2600,4200,5400],[2900,4900,6200],[3300,5400,7800],[3800,6100,9800],[4500,7200,11700],[5000,8700,14200],[5500,10700,17200],[6400,13200,22000]];
export const THRESHOLDS_2014=[[25,50,75,100],[50,100,150,200],[75,150,225,400],[125,250,375,500],[250,500,750,1100],[300,600,900,1400],[350,750,1100,1700],[450,900,1400,2100],[550,1100,1600,2400],[600,1200,1900,2800],[800,1600,2400,3600],[1000,2000,3000,4500],[1100,2200,3400,5100],[1250,2500,3800,5700],[1400,2800,4300,6400],[1600,3200,4800,7200],[2000,3900,5900,8800],[2100,4200,6300,9500],[2400,4900,7300,10900],[2800,5700,8500,12700]];
const XP=[10,200,450,700,1100,1800,2300,2900,3900,5000,5900,7200,8400,10000,11500,13000,15000,18000,20000,22000,25000,33000,41000,50000,62000,75000,90000,105000,120000,135000,155000];
export function xpForCR(cr){if(cr==='1/8')return 25;if(cr==='1/4')return 50;if(cr==='1/2')return 100;const n=Number(cr);if(cr===''||cr==null||!Number.isInteger(n)||n<0||n>30)throw Error(`ND sem XP identificado: ${cr}`);return XP[n];}
export function difficulty({edition='2024',levels,monsters=[]}){
 if(!['2014','2024'].includes(edition))throw Error('Selecione regras 2014 ou 2024.');
 if(!Array.isArray(levels)||!levels.length||levels.length>100||levels.some(n=>!Number.isInteger(n)||n<1||n>20))throw Error('Informe de 1 a 100 personagens com níveis entre 1 e 20.');
 let total=0,count=0;
 const lines=monsters.map(m=>{const quantity=Number(m.quantity??1);if(!Number.isInteger(quantity)||quantity<1||quantity>1000)throw Error('Quantidade de criaturas inválida.');const xp=m.xp!==undefined?Number(m.xp):xpForCR(m.cr);if(!Number.isFinite(xp)||xp<0)throw Error('XP inválido.');if(m.side!=='ally'){total+=xp*quantity;if(m.countForMultiplier!==false)count+=quantity;}return {name:m.name||'Criatura',cr:m.cr,xp,quantity,total:xp*quantity,side:m.side||'enemy',countForMultiplier:m.countForMultiplier!==false};});
 const table=edition==='2024'?BUDGET_2024:THRESHOLDS_2014;
 const labels=edition==='2024'?['Baixa','Moderada','Alta']:['Fácil','Média','Difícil','Mortal'];
 const budgets=labels.map((label,i)=>({label,xp:levels.reduce((s,n)=>s+table[n-1][i],0)}));
 let multiplier=1;
 if(edition==='2014'&&count){const steps=[0.5,1,1.5,2,2.5,3,4,5];let index=count===1?1:count===2?2:count<=6?3:count<=10?4:count<=14?5:6;if(levels.length<3)index++;if(levels.length>=6)index--;multiplier=steps[index];}
 const adjusted=total*multiplier;
 let label;
 if(edition==='2024')label=total===0?'Sem adversários':total<=budgets[0].xp?'Baixa':total<=budgets[1].xp?'Moderada':total<=budgets[2].xp?'Alta':'Acima do orçamento alto';
 else label=[...budgets].reverse().find(x=>adjusted>=x.xp)?.label||'Abaixo de fácil';
 return {edition,source:edition==='2024'?SOURCE_2024:SOURCE_2014,method:edition==='2024'?'Orçamento máximo de XP por personagem; sem multiplicador por quantidade.':'Limiares de XP ajustado; multiplicador por adversários e tamanho do grupo.',budgets,total,count,multiplier,adjusted,label,lines,assumptions:edition==='2024'?'Níveis diferentes: os orçamentos individuais são somados (extensão explícita da calculadora). Os valores da tabela são tetos de orçamento.':'Desmarque criaturas insignificantes para o multiplicador conforme o julgamento do mestre; seu XP continua na soma. Aliados não geram XP e não ajustam automaticamente o grupo.',limitations:'ND descreve uma criatura, não a dificuldade do encontro. Terreno, surpresa, recursos restantes, composição, objetivos e habilidades incomuns podem alterar muito o risco real.'};
}
export function roll(expression,rng=sides=>randomInt(1,sides+1)){
 if(typeof expression!=='string'||expression.length>100)throw Error('Fórmula inválida.');
 const input=expression.toLowerCase().replace(/\s/g,'').replace(/×/g,'*');
 if(!/^[+\-\dd*]+$/.test(input))throw Error('Use NdM, modificadores +/− e multiplicadores, por exemplo 2d6+3 ou 3d6*100.');
 const tokens=input.match(/[+-]?[^+-]+/g)||[];let total=0;const detail=[];
 for(const token of tokens){const m=token.match(/^([+-]?)(?:(\d*)d(\d+)|(\d+))(?:\*(\d+))?$/);if(!m)throw Error('Fórmula de dados não reconhecida.');const sign=m[1]==='-'?-1:1;const times=Number(m[5]||1);let subtotal,values=[];if(m[3]){const count=Number(m[2]||1),sides=Number(m[3]);if(count<1||count>100||sides<2||sides>10000)throw Error('Limite: 100 dados de 2 a 10.000 faces.');values=Array.from({length:count},()=>rng(sides));subtotal=values.reduce((a,b)=>a+b,0);}else subtotal=Number(m[4]);total+=sign*subtotal*times;detail.push({term:token,values,multiplier:times,subtotal:sign*subtotal*times});}
 if(!Number.isSafeInteger(total)||Math.abs(total)>1e12)throw Error('Resultado fora do limite.');
 return {expression,total,detail,at:new Date().toISOString(),method:'Gerador criptográfico local (node:crypto.randomInt)'};
}
export function validateTreasureTable(table){
 if(table?.engine==='5etools-loot'){
 if(!table.root?.name||!table.root?.source||!table.support||!['individual','hoard','dragon'].includes(table.kind))throw Error('Tabela 5etools incompleta.');
 return {valid:true,engine:'5etools-loot',source:table.root.source,rows:table.root.table?.length||1};
 }
 if(!table?.name||!table.source||!['2014','2024','caseiro'].includes(table.edition)||!Array.isArray(table.rows)||!table.rows.length||table.rows.length>10000)throw Error('Tabela precisa de nome, fonte, edição e linhas.');
 const min=roll(table.dice||'1d100',()=>1).total;const max=roll(table.dice||'1d100',s=>s).total;
 const rows=[...table.rows].sort((a,b)=>a.min-b.min);let next=min;
 for(const row of rows){if(!Number.isInteger(row.min)||!Number.isInteger(row.max)||row.max<row.min||row.min!==next)throw Error('Intervalos precisam cobrir todos os resultados sem lacunas ou sobreposições.');next=row.max+1;for(const [currency,expr]of Object.entries(row.coins||{})){if(!['pc','pp','pe','po','pl'].includes(currency))throw Error('Moeda inválida.');if(roll(String(expr),()=>1).total<0)throw Error('Quantidade negativa de moedas.');}for(const r of row.rewards||[]){if(!r.name)throw Error('Toda recompensa precisa de nome.');if(roll(String(r.quantity||'1'),()=>1).total<0)throw Error('Quantidade negativa.');}}
 if(next!==max+1)throw Error('A tabela não cobre exatamente os resultados possíveis da fórmula.');
 return {valid:true,min,max,rows:rows.length};
}
export function treasure(table,rng){
 validateTreasureTable(table);
 if(table.engine==='5etools-loot')return nativeTreasure(table,rng);
 if(!table?.name||!table.source||!['2014','2024','caseiro'].includes(table.edition)||!Array.isArray(table.rows))throw Error('Tabela de tesouro precisa de nome, fonte, edição e rows.');
 const trace=[];const selection=roll(table.dice||'1d100',rng);trace.push(selection);
 const matches=table.rows.filter(r=>selection.total>=r.min&&selection.total<=r.max);if(matches.length!==1)throw Error('Tabela com lacuna ou intervalos sobrepostos para a rolagem.');
 const row=matches[0];const coins={};for(const [currency,expr]of Object.entries(row.coins||{})){if(!['pc','pp','pe','po','pl'].includes(currency))throw Error('Moeda inválida.');const r=typeof expr==='number'?{expression:String(expr),total:expr,detail:[]}:roll(expr,rng);if(r.total<0)throw Error('Moedas negativas.');trace.push(r);coins[currency]=r.total;}
 const results=(row.rewards||[]).map(x=>{const r=roll(x.quantity||'1',rng);trace.push(r);return {name:x.name,kind:x.kind||'personalizada',recordId:x.recordId||null,quantity:r.total,value:x.value||'',notes:x.notes||''};});
 return {tableId:table.id,tableName:table.name,source:table.source,edition:table.edition,page:table.page||'',row:{min:row.min,max:row.max},coins,results,notes:row.text||'',trace,delivered:false};
}
function nativeTreasure(table,rng){
 const root=table.root;const support=table.support;const edition=table.edition||(/^X/.test(root.source)?'2024':'2014');
 const defaultSource=edition==='2024'?'XDMG':'DMG';const trace=[],coins={},results=[],notes=[];let operations=0;
 const clean=s=>String(s||'').replace(/\{@\w+ ([^{}]+)\}/g,(_,s)=>s.split('|')[2]||s.split('|')[0]);
 const draw=(formula,origin)=>{if(++operations>2000)throw Error('Limite de 2.000 operações de tesouro.');const r=roll(String(formula),rng);trace.push({...r,table:origin.name,source:origin.source,page:origin.page});return r.total;};
 const choose=(rows,origin)=>{
 if(!rows?.length)throw Error(`Tabela vazia: ${origin.name}`);
 if(typeof rows[0]==='string')return rows[draw(`1d${rows.length}`,origin)-1];
 const max=Math.max(...rows.map(x=>x.max||x.min||0));const n=draw(`1d${max}`,origin);const match=rows.filter(x=>n>=x.min&&n<=x.max);if(match.length!==1)throw Error(`Lacuna ou sobreposição em ${origin.name}, resultado ${n}.`);return match[0];
 };
 const addCoins=(obj,origin)=>{for(const [key,expr]of Object.entries(obj||{})){const currency={cp:'pc',sp:'pp',ep:'pe',gp:'po',pp:'pl'}[key];if(!currency)throw Error('Moeda desconhecida: '+key);coins[currency]=(coins[currency]||0)+draw(expr,origin);}};
 function addTyped(kind,entry){
 const count=draw(entry.amount||'1',root);if(count<0||count>500)throw Error('Limite de 500 objetos por rolagem.');
 for(let i=0;i<count;i++){
 const type=entry.type??(entry.typeTable?choose(entry.typeTable,root).type:null);
 const data=(support[kind]||[]).find(x=>String(x.type)===String(type)&&x.source===defaultSource);
 if(!data){results.push({name:`Escolher manualmente: ${kind}, tabela ${type}`,kind:'decisão do mestre',quantity:1,notes:'Tabela da edição/fonte não importada.'});continue;}
 const result=choose(data.table,data);if(typeof result==='string')results.push({name:clean(result),kind:kind==='gems'?'gema':'arte',quantity:1,value:`${data.type} po`,source:data.source,tableName:data.name});
 else if(result.item)results.push({name:clean(result.item),kind:'mágico',quantity:1,source:data.source,tableName:data.name,originalReference:result.item,notes:result.spellLevel!==undefined?`Círculo da magia: ${result.spellLevel}. Escolha a magia manualmente.`:''});
 else {results.push({name:'Escolha manual de item mágico',kind:'decisão do mestre',quantity:1,source:data.source,notes:JSON.stringify(result)});}
 }
 }
 const selected=root.table?choose(root.table,root):root;
 addCoins(root.coins,root);if(selected!==root)addCoins(selected.coins,root);
 for(const kind of ['gems','artObjects'])if(selected[kind])addTyped(kind,selected[kind]);
 for(const entry of selected.magicItems||[])addTyped('magicItems',entry);
 if(selected.dragonMundaneItems){const count=draw(selected.dragonMundaneItems.amount||'1',root);if(count>500)throw Error('Objetos mundanos acima do limite.');for(let i=0;i<count;i++){const x=choose(support.dragonMundaneItems,{name:'Objetos mundanos de dragão',source:root.source,page:root.page});results.push({name:clean(x.item),kind:'objeto mundano',quantity:1});}}
 return {tableId:table.id,tableName:table.name||root.name,source:root.source,edition,page:root.page,row:{min:selected.min||1,max:selected.max||1},coins,results,trace,notes:notes.join('\n'),delivered:false};
}
