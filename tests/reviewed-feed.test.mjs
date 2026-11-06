import {test} from 'node:test';
import assert from 'node:assert/strict';
import {previewSupplierBatch} from '../lib/market-ingestion.ts';
import {matchReviewedDream,approvedMarketListings} from '../lib/reviewed-feed.ts';
const now=new Date('2026-11-06T16:00:00Z');
const contract={supplier_id:'demo',display_name:'Fonte autorizada de teste',allowed_hosts:['example.org'],countries:['DE'],permission_reference:'CONTRATO-DE-TESTE',permission_valid_until:'2027-01-01T00:00:00Z',allows_display:true,allows_price_history:true};
const input={supplier_listing_id:'DE-01',brand:'BMW',model:'X5',version:'xDrive40i',year:2022,mileage_km:42000,fuel:'gasolina',asking_price_eur:45000,country:'DE',listing_url:'https://example.org/de-01',observed_at:'2026-11-06T10:00:00Z'};
const dream={brand:'BMW',model:'X5',version:'xDrive40i',year_from:2020,year_to:2024,max_mileage_km:60000,fuel:'gasolina',budget_eur:65000};
test('full pipeline preview -> pending -> no matches, approval -> match',()=>{
 const preview=previewSupplierBatch(contract,[input],now);assert.equal(preview.accepted_count,1);
 const pending=[{review_status:'pending',payload:preview.accepted[0]}];
 assert.equal(matchReviewedDream(dream,pending,now).length,0);
 const approved=[{review_status:'approved',payload:preview.accepted[0]}];
 const matches=matchReviewedDream(dream,approved,now);
 assert.equal(matches.length,1);assert.equal(matches[0].listing.id,'demo:DE-01');
});
test('rejected and expired records do not match',()=>{
 const record=previewSupplierBatch(contract,[input],now).accepted[0];
 assert.equal(approvedMarketListings([{review_status:'rejected',payload:record}],now).length,0);
 assert.equal(approvedMarketListings([{review_status:'approved',payload:record}],new Date('2026-11-20T10:00:00Z')).length,0);
});
test('missing supplier permission rejects batch',()=>{
 const preview=previewSupplierBatch({...contract,allows_price_history:false},[input],now);
 assert.equal(preview.accepted_count,0);
});
