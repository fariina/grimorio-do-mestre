import {readReference,fullReference} from './reference.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as C from '../public/content.mjs';
const records=readReference().records;
const monster=n=>records.find(r=>r.name===n&&r.source==='MM');
test('normalização compartilhada: perícias, deslocamento, idiomas, sentidos e exceções',()=>{
 assert.equal(C.textFromHtml(C.formatValue({stealth:'+6'},'skill')),'Furtividade +6');assert.equal(C.textFromHtml(C.formatValue(['Common','Goblin'],'languages')),'Comum, Goblin');
 assert.equal(C.textFromHtml(C.formatValue({walk:30,fly:{number:60,condition:'(hover)'}},'speed')),'Terrestre 30 pés; Voo 60 pés (hover)');
 assert.equal(C.textFromHtml(C.formatValue(['darkvision 60 ft.'],'senses')),'Visão no escuro 60 pés');
 const s=C.formatValue([{resist:['fire','cold'],note:'from nonmagical attacks'}],'resist');assert.match(s,/fogo, frio/);assert.match(s,/from nonmagical attacks/);assert.doesNotMatch(s,/\{"/);
});
test('parser balanceado: ataque, média, bônus, rolagens, CD e referências',()=>{
 const html=C.renderMarkup('{@atk mw,rw} {@hit 4} to hit. {@h}5 ({@damage 1d6 + 2}) {@condition prone}. {@dc 12} {@recharge 5} {@actSave dex}');
 assert.match(html,/Ataque corpo a corpo com arma/);assert.match(html,/Ataque à distância com arma/);assert.match(html,/1d20\+4/);assert.match(html,/Acerto:/);assert.match(html,/1d6 \+ 2/);assert.match(html,/CD 12/);assert.match(html,/Destreza/);assert.match(html,/Caído/);assert.doesNotMatch(html,/\{@|\bmw\b|\brw\b/);
 assert.match(C.renderMarkup('{@b texto {@condition poisoned}}'),/<b>texto <button/);
});
test('monstros reais complexos: dragão, enxame e conjuração sem JSON normal',()=>{
 for(const n of ['Goblin','Adult Red Dragon','Swarm of Rats','Archmage']){
 const r=monster(n);assert.ok(r,n);const html=C.renderRecordBody(r);assert.doesNotMatch(C.textFromHtml(html),/\{@|\{"|\["|\bmw\b|\brw\b/);assert.match(html,/Ações/);
 }
 const dragon=C.renderRecordBody(monster('Adult Red Dragon'));assert.match(dragon,/Escalada 40 pés/);assert.match(dragon,/Visão no escuro 120 pés/);assert.match(dragon,/Ações lendárias/);assert.match(dragon,/18d6/);
});
test('marcações desconhecidas preservam o conteúdo e geram diagnóstico',()=>{const diagnostics=[];const html=C.renderMarkup('A {@futureTag 17|2d8|exceção} B',{diagnostics:x=>diagnostics.push(x)});assert.equal(diagnostics[0].tag,'futureTag');assert.match(html,/17/);assert.match(html,/2d8/);assert.match(html,/exceção/);assert.doesNotMatch(html,/\{@/);});
test('dados importados nunca executam HTML em marcadores ou campos estruturais',()=>{const payload='<img src=x onerror=alert(1)>';const r={category:'monster',raw:{ac:[{ac:payload}],hp:{average:payload},speed:{fly:{number:payload}},action:[{name:payload,entries:['{@atk '+payload+'}']}]}};const html=C.renderRecordBody(r);assert.doesNotMatch(html,/<img\s|<script\s/);assert.match(html,/&lt;img/);});
test('tradução protege números, unidades, estrutura e referências',()=>{const s='The goblin has 5 ft. of reach and {@damage 2d6 + 3} damage. {@h}';const protectedText=C.protectText(s);assert.doesNotMatch(protectedText.text,/\{@|2d6|5 ft\./);const translated=protectedText.restore(protectedText.text.replace('The goblin has','O goblin tem'));assert.equal(C.mechanicalSignature(translated),C.mechanicalSignature(s));assert.throws(()=>protectedText.restore('corrompido'),/marcador/);});
