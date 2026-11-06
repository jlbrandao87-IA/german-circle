import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/202611060001_initial.sql',import.meta.url),'utf8');
test('Three private tables have row-level security',()=>{
 for(const table of ['member_profiles','garage_vehicles','member_consents']){
  assert.match(sql,new RegExp(`alter table public\\.${table} enable row level security`));
  for(const action of ['select','insert','update','delete'])assert.match(sql,new RegExp(`on public\\.${table} for ${action} to authenticated`));
 }
});
test('Server enforces five cars per garage even with concurrent operations',()=>{
 assert.match(sql,/pg_advisory_xact_lock/);assert.match(sql,/current_count >= 5/);
});
test('No secret server-side key is configured in the web client',()=>{
 const client=readFileSync(new URL('../lib/supabase.ts',import.meta.url),'utf8');
 assert.doesNotMatch(client,/SERVICE_ROLE|secret_key|SUPABASE_SERVICE/);
});
