import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/202611060002_dream_preferences.sql',import.meta.url),'utf8');
const types=readFileSync(new URL('../lib/types.ts',import.meta.url),'utf8');
const page=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
test('Dream preferences are validated both client-side and in SQL',()=>{
 for(const key of ['priority','year_to','max_mileage_km','fuel']){assert.match(sql,new RegExp(key));assert.match(types,new RegExp(key));assert.match(page,new RegExp(key));}
 assert.match(sql,/valid_year_range/);assert.match(types,/year_to < car.year_from/);
});
test('Modal supports keyboard dismissal and focus cycle',()=>{assert.match(page,/e.key==='Escape'/);assert.match(page,/e.key==='Tab'/);assert.match(page,/ref=\{modalRef\}/);});
test('Market claims remain explicitly unavailable',()=>{assert.match(page,/Ainda não existe um fornecedor de preços integrado/);});
