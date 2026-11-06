import {test} from 'node:test';
import assert from 'node:assert/strict';
import {candidateChecksum,queueRows,safeImportAudit} from '../lib/ingestion-batch.ts';
const candidate={supplier_id:'sample',supplier_listing_id:'abc',brand:'BMW',model:'X5',version:'M Sport',year:2022,mileage_km:48000,fuel:'diesel',asking_price_eur:45000,country:'DE',source_url:'https://example.org/car',observed_at:'2026-11-05T08:00:00.000Z',verified_at:'2026-11-06T08:00:00.000Z',expires_at:'2026-11-09T08:00:00.000Z',status:'draft'};
test('hash stable regardless of property order',()=>assert.equal(candidateChecksum(candidate),candidateChecksum(Object.fromEntries(Object.entries(candidate).reverse()))));
test('price change leads to new checksum',()=>assert.notEqual(candidateChecksum(candidate),candidateChecksum({...candidate,asking_price_eur:44000})));
test('review rows are never automatically published',()=>{const [row]=queueRows([candidate]);assert.equal(row.review_status,'pending');assert.equal(row.payload.status,'draft');assert.equal(row.payload_checksum.length,64);});
test('audit does not contain listing payload or private preferences',()=>{const a=safeImportAudit({actor_id:'a',supplier_id:'s',batch_rows:1,accepted:1,rejected:0,inserted:1,duplicate:0});assert.deepEqual(Object.keys(a),['actor_id','supplier_id','batch_rows','accepted','rejected','inserted','duplicate','error_code']);});
