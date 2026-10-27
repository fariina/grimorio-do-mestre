// Validação de domínio antes de qualquer gravação ou restauração.
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
export function validateEntity(kind,data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Dados do elemento precisam ser um objeto.');
 if(data.participants?.some?.(p=>typeof p.id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_.:@-]{0,199}$/.test(p.id)))throw Error('Identificador de participante inválido.');
 if(data.links!==undefined&&(!Array.isArray(data.links)||data.links.length>500||data.links.some(x=>typeof x!=='string'||x.length>200)))throw Error('Vínculos inválidos.');
 for(const [k,v]of Object.entries(data))if(typeof v==='string'&&v.length>2_000_000)throw Error(`Campo muito extenso: ${k}`);
 if(kind==='character'){
 if(data.level!==undefined&&(!finite(data.level,1,20)||!Number.isInteger(data.level)))throw Error('Nível do personagem deve ser inteiro entre 1 e 20.');
 if(data.maxHp!==undefined&&!finite(data.maxHp,1,1e8))throw Error('PV máximos do personagem inválidos.');
 }
 if(kind==='check'){
 if(data.dc!==undefined&&!finite(data.dc,0,100))throw Error('CD deve estar entre 0 e 100.');
 if(data.mode!==undefined&&!['individual','grupo'].includes(data.mode))throw Error('Modo do teste inválido.');
 }
 if(kind==='encounter'){
 if(data.participants)validateEntity('combat',{participants:data.participants,round:1,turn:0});
 const monsters=data.monsters||[];if(!Array.isArray(monsters)||monsters.length>500)throw Error('Lista de criaturas inválida.');
 let count=0;for(const m of monsters){if(!m.name||typeof m.name!=='string'||!Number.isInteger(m.quantity)||m.quantity<1||m.quantity>100)throw Error('Criaturas precisam de nome e quantidade inteira de 1 a 100.');count+=m.quantity;if(m.maxHp!=null&&!finite(m.maxHp,1,1e8))throw Error('PV da criatura inválidos.');if(m.xp!==undefined&&!finite(m.xp,0,1e9))throw Error('XP da criatura inválido.');if(m.side&&!['ally','enemy'].includes(m.side))throw Error('Lado da criatura inválido.');}if(count>500)throw Error('Máximo de 500 participantes por encontro.');
 }
 if(kind==='combat'){
 if(!Array.isArray(data.participants)||data.participants.length>1000||!Number.isInteger(data.round)||data.round<1||!Number.isInteger(data.turn)||data.turn<0||data.turn>=Math.max(1,data.participants.length))throw Error('Estado de combate inválido.');
 const ids=new Set();for(const p of data.participants){if(!p.id||ids.has(p.id)||!p.name||!finite(p.maxHp,1,1e8)||!finite(p.hp,0,p.maxHp)||!finite(p.tempHp,0,1e8)||!finite(p.initiative,-1000,1000))throw Error('Ficha de combate inválida.');ids.add(p.id);
 for(const k of ['conditions','effects']){if(!Array.isArray(p[k])||p[k].some(x=>!x.name||(x.remaining!=null&&(!Number.isInteger(x.remaining)||x.remaining<1))))throw Error('Condição ou duração inválida.');}
 if(!Array.isArray(p.resources)||p.resources.some(r=>!r.name||!finite(r.max,0,1e8)||!finite(r.current,0,r.max)||(r.recharge!==undefined&&r.recharge!==''&&(!Number.isInteger(Number(r.recharge))||Number(r.recharge)<2||Number(r.recharge)>6))))throw Error('Recurso de combate inválido.');
 }
 }
 return true;
}
