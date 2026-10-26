import {readFileSync,existsSync} from 'node:fs';
export const fullReference=existsSync('reference/open-srd.json');
export function readReference(){return JSON.parse(readFileSync(fullReference?'reference/open-srd.json':'tests/fixtures/srd-reference.json','utf8'));}
