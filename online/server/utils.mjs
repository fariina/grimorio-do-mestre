import {createHash,randomBytes} from 'node:crypto';
export const now=()=>new Date().toISOString();
export const hash=s=>createHash('sha256').update(s).digest('hex');
export const random=()=>randomBytes(32).toString('base64url');
export function fail(message,status=400){throw Object.assign(Error(message),{status});}
export const TABLES=['records','annotations','campaigns','entities','history','glossary','translation_cache','imports','content_translations'];
export const keyOf=(table,row)=>String(table==='content_translations'?row.record_id+':'+row.source_hash:row.id??row.record_id??row.term??row.hash??row.tag);
export function json(body,status=200,headers={}){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...headers}});}
