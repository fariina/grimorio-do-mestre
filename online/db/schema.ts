import {sqliteTable,text,integer,primaryKey,index,check} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
export const state=sqliteTable('grimorio_state',{id:text('id').primaryKey(),dataset:text('dataset').notNull(),revision:integer('revision').notNull().default(0),ownerId:text('owner_id'),csrf:text('csrf').notNull(),initialized:integer('initialized').notNull().default(0)});
export const guard=sqliteTable('grimorio_guard',{id:integer('id').primaryKey(),valid:integer('valid').notNull()},t=>[check('guard_valid',sql`${t.valid} = 1`)]);
export const rows=sqliteTable('grimorio_rows',{dataset:text('dataset').notNull(),table:text('tn').notNull(),key:text('k').notNull(),value:text('value').notNull(),parent:text('parent').notNull().default(''),category:text('category').notNull().default(''),name:text('name').notNull().default(''),source:text('source').notNull().default(''),edition:text('edition').notNull().default(''),search:text('search').notNull().default('')},t=>[primaryKey({columns:[t.dataset,t.table,t.key]}),index('rows_parent').on(t.dataset,t.table,t.parent),index('rows_library').on(t.dataset,t.table,t.category,t.edition,t.source)]);
// Sonda técnica separada de campanhas/biblioteca, usada apenas na verificação de persistência.
export const probes=sqliteTable('grimorio_probes',{id:text('id').primaryKey(),value:text('value').notNull()});
