import test from 'node:test';
import assert from 'node:assert/strict';
import {readBoundedJson} from '../lib/server/bounded-json.ts';

test('reads JSON within enforced body limit',async()=>{
 const req=new Request('https://example.org/api',{method:'POST',body:JSON.stringify({supplier_id:'demo'})});
 assert.deepEqual(await readBoundedJson(req,1024),{supplier_id:'demo'});
});
test('blocks oversized body even without content-length',async()=>{
 const req=new Request('https://example.org/api',{method:'POST',body:'x'.repeat(1000)});
 await assert.rejects(()=>readBoundedJson(req,100),/payload_too_large/);
});
test('blocks oversized declared size early',async()=>{
 const req=new Request('https://example.org/api',{method:'POST',headers:{'content-length':'1000'},body:'{}'});
 await assert.rejects(()=>readBoundedJson(req,100),/payload_too_large/);
});
test('rejects invalid JSON',async()=>{
 const req=new Request('https://example.org/api',{method:'POST',body:'{broken'});
 await assert.rejects(()=>readBoundedJson(req,100),/invalid_json/);
});
test('handles multi-chunk Unicode payload',async()=>{
 const bytes=new TextEncoder().encode(JSON.stringify({name:'Ação'}));
 const stream=new ReadableStream({start(controller){for(let i=0;i<bytes.length;i++)controller.enqueue(bytes.slice(i,i+1));controller.close();}});
 const req=new Request('https://example.org/api',{method:'POST',body:stream,duplex:'half'});
 assert.deepEqual(await readBoundedJson(req,100),{name:'Ação'});
});
