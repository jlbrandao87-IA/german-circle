import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {previewSupplierBatch} from '../lib/market-ingestion.ts';
const now=new Date('2026-11-06T12:00:00Z');
const supplier={supplier_id:'demo_partner',display_name:'Parceiro de demonstração',allowed_hosts:['example.org'],countries:['DE','PT'],permission_reference:'DEMO-NOT-LICENSED',permission_valid_until:'2026-12-01T00:00:00Z',allows_display:true,allows_price_history:true};
const car={supplier_listing_id:'stock-1',brand:'BMW',model:'X5',version:'xDrive40i',year:2023,mileage_km:35000,fuel:'gasolina',asking_price_eur:46000,country:'DE',listing_url:'https://example.org/vehicle/stock-1',observed_at:'2026-11-05T09:00:00Z'};
test('valid licensed-shaped data enters review only and is not published',()=>{
 const out=previewSupplierBatch(supplier,[car],now);
 assert.equal(out.accepted_count,1);assert.equal(out.publishable_count,0);assert.equal(out.accepted[0].status,'draft');
 assert.equal(out.accepted[0].external_key,'demo_partner:stock-1');
});
test('unapproved source hostname and http are rejected',()=>{
 const out=previewSupplierBatch(supplier,[{...car,listing_url:'https://malicious.example/vehicle'}, {...car,listing_url:'http://example.org/vehicle'}],now);
 assert.equal(out.accepted_count,0);assert.equal(out.rejected_count,2);
});
test('expired or insufficient data contract blocks all records',()=>{
 for(const change of [{permission_valid_until:'2026-11-01T00:00:00Z'},{allows_display:false},{allows_price_history:false}]){
  const out=previewSupplierBatch({...supplier,...change},[car],now);assert.equal(out.accepted_count,0);
 }
});
test('duplicate records rejected; prices must be numeric and positive',()=>{
 const out=previewSupplierBatch(supplier,[car,car,{...car,supplier_listing_id:'2',asking_price_eur:'46000'}, {...car,supplier_listing_id:'3',asking_price_eur:0}],now);
 assert.equal(out.accepted_count,1);assert.equal(out.rejected_count,3);
});
test('stale, future, and unauthorized-country records rejected',()=>{
 const out=previewSupplierBatch(supplier,[{...car,observed_at:'2026-10-01T00:00:00Z'}, {...car,observed_at:'2026-11-07T00:00:00Z'}, {...car,country:'FR'}],now);
 assert.equal(out.accepted_count,0);assert.equal(out.rejected_count,3);
});
test('private review queue is not readable by members',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/202611060007_supplier_review_pipeline.sql',import.meta.url),'utf8');
 assert.match(sql,/market_import_review_queue enable row level security/);
 assert.match(sql,/revoke all on public.market_import_review_queue from anon,authenticated/);
 assert.doesNotMatch(sql,/create policy .*market_import_review_queue/i);
});
