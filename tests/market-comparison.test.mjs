import test from 'node:test';
import assert from 'node:assert/strict';
import {compareMarkets,pairComparable,verifiedLandedCost} from '../lib/market-comparison.ts';
const now=new Date('2026-11-06T15:00:00.000Z');
const base={brand:'BMW',model:'X5',version:'xDrive40i M Sport',year:2022,mileage_km:42000,fuel:'gasolina',source_name:'Licensed example feed',source_url:'https://example.org/cars/123',observed_at:'2026-11-04T09:00:00Z',verified_at:'2026-11-05T09:00:00Z',expires_at:'2026-11-09T09:00:00Z'};
const de={...base,id:'de1',country:'DE',asking_price_eur:45000};
const pt={...base,id:'pt1',country:'PT',asking_price_eur:62000};
const quote={listing_id:'de1',purchase_eur:45000,isv_eur:4100,vat_eur:0,transport_eur:900,inspection_eur:200,registration_eur:300,service_eur:700,other_eur:100,source_name:'Manually reviewed quote',source_reference:'Q-123',verified_at:'2026-11-05T08:00:00Z',valid_until:'2026-11-08T18:00:00Z',status:'approved'};
test('Accept exact matching cars with high confidence',()=>{const x=pairComparable(de,pt,now);assert.equal(x?.confidence,'high');});
test('Reject a different model or brand',()=>{assert.equal(pairComparable(de,{...pt,model:'X3'},now),null);assert.equal(pairComparable(de,{...pt,brand:'Audi'},now),null);});
test('Reject very different age, mileage, fuel or stale listings',()=>{
  assert.equal(pairComparable(de,{...pt,year:2018},now),null);
  assert.equal(pairComparable(de,{...pt,mileage_km:90000},now),null);
  assert.equal(pairComparable(de,{...pt,fuel:'diesel'},now),null);
  assert.equal(pairComparable({...de,expires_at:'2026-11-01T00:00:00Z'},pt,now),null);
});
test('Approved complete and fresh quote returns cost incl all expenses',()=>{
  assert.equal(verifiedLandedCost(quote,de,now),51300);
});
test('Missing tax never treated as zero',()=>{
  assert.equal(verifiedLandedCost({...quote,isv_eur:null},de,now),null);
  assert.equal(verifiedLandedCost({...quote,vat_eur:null},de,now),null);
});
test('Unapproved, expired or mismatched quotes never generate landed costs',()=>{
  assert.equal(verifiedLandedCost({...quote,status:'draft'},de,now),null);
  assert.equal(verifiedLandedCost({...quote,valid_until:'2026-11-06T09:00:00Z'},de,now),null);
  assert.equal(verifiedLandedCost({...quote,purchase_eur:44500},de,now),null);
  assert.equal(verifiedLandedCost({...quote,listing_id:'elsewhere'},de,now),null);
  assert.equal(verifiedLandedCost({...quote,source_reference:''},de,now),null);
});
test('High confidence and a verified complete cost permits comparison',()=>{
  const x=compareMarkets([de,pt],[quote],now);assert.equal(x.length,1);
  assert.equal(x[0].landed_eur,51300);assert.equal(x[0].price_difference_eur,10700);
});
test('Do not show an alleged saving when cost quote is absent',()=>{
  const x=compareMarkets([de,pt],[],now);assert.equal(x[0].landed_eur,null);assert.equal(x[0].price_difference_eur,null);
});
test('Do not show savings between different trim versions',()=>{
  const x=compareMarkets([de,{...pt,version:'xDrive30d basic'}],[quote],now);
  assert.equal(x[0].confidence,'medium');assert.equal(x[0].price_difference_eur,null);
});
test('A higher imported total is negative, never presented as savings',()=>{
  const x=compareMarkets([de,{...pt,asking_price_eur:50000}],[quote],now);assert.equal(x[0].price_difference_eur,-1300);
});
test('Cannot compare countries other than DE vs PT or fabricate missing references',()=>{
  assert.deepEqual(compareMarkets([de], [quote],now),[]);
  assert.deepEqual(compareMarkets([pt],[quote],now),[]);
});
