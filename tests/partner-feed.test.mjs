import test from 'node:test';
import assert from 'node:assert/strict';
import {mapAuthorizedCsv} from '../lib/partner-feed.ts';
import {previewSupplierBatch} from '../lib/market-ingestion.ts';
const columns={supplier_listing_id:'id',brand:'make',model:'model',version:'trim',year:'year',mileage_km:'km',fuel:'fuel',asking_price_eur:'price',country:'country',listing_url:'url',observed_at:'date'};
const map={columns,brand_aliases:{Mercedes:'Mercedes-Benz'},fuel_aliases:{Petrol:'gasolina'},country_aliases:{Germany:'DE'},decimal_separator:'.'};
const head='id,make,model,trim,year,km,fuel,price,country,url,date\n';
const row='x1,Mercedes,"C Class, AMG",C300,2023,40000,Petrol,45000,Germany,https://example.org/1,2026-11-05T09:00:00Z\n';
test('authorized CSV export normalizes supplier aliases and quoted commas',()=>{
 const out=mapAuthorizedCsv(head+row,map);assert.equal(out.rows.length,1);assert.equal(out.rows[0].brand,'Mercedes-Benz');assert.equal(out.rows[0].model,'C Class, AMG');assert.equal(out.rows[0].country,'DE');
});
test('previews mapped records; never publishes even when contract shaped correctly',()=>{
 const contract={supplier_id:'demo',display_name:'Demo',allowed_hosts:['example.org'],countries:['DE'],permission_reference:'DEMO-UNVERIFIED',permission_valid_until:'2026-12-01T00:00:00Z',allows_display:true,allows_price_history:true};
 const result=previewSupplierBatch(contract,mapAuthorizedCsv(head+row,map).rows,new Date('2026-11-06T12:00:00Z'));
 assert.equal(result.accepted_count,1);assert.equal(result.publishable_count,0);assert.equal(result.accepted[0].status,'draft');
});
test('malformed headers, unsafe quoting and duplicated headers are refused',()=>{
 assert.throws(()=>mapAuthorizedCsv(head.replace('id,','bad,')+row,map),/unknown_column/);
 assert.throws(()=>mapAuthorizedCsv(head+'"unclosed',map),/unclosed_quote/);
 assert.throws(()=>mapAuthorizedCsv(head.replace('make,','id,')+row,map),/duplicate_header/);
});
test('bad currency and malformed row fail before market review',()=>{
 const bad=mapAuthorizedCsv(head+row.replace('45000','45.000,00'),map);
 assert.equal(bad.rows.length,0);assert.equal(bad.errors[0].code,'column_count_mismatch');
});
test('decimal comma accepted only when explicitly configured',()=>{
 const m={...map,decimal_separator:','};
 const csv=head+row.replace('45000','"45000,50"');
 assert.equal(mapAuthorizedCsv(csv,m).rows[0].asking_price_eur,45000.5);
});
test('limits export size and count',()=>{
 assert.throws(()=>mapAuthorizedCsv(head+row.repeat(4),map,2),/too_many_rows/);
 assert.throws(()=>mapAuthorizedCsv('x'.repeat(4*1024*1024+1),map),/feed_too_large/);
});
