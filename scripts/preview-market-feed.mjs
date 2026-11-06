#!/usr/bin/env node
// Local audit preview. Never fetches URLs, writes to a database or publishes listings.
import {readFileSync,writeFileSync} from 'node:fs';
import {previewSupplierBatch} from '../lib/market-ingestion.ts';
const [contractPath,recordsPath,outputPath]=process.argv.slice(2);
if(!contractPath||!recordsPath){
 console.error('Uso: node --experimental-strip-types scripts/preview-market-feed.mjs <contract.json> <records.json> [output.json]');
 process.exitCode=2;
}else{
 try{
  const contract=JSON.parse(readFileSync(contractPath,'utf8'));
  const records=JSON.parse(readFileSync(recordsPath,'utf8'));
  if(!Array.isArray(records)||records.length>10000)throw Error('O lote deve ser uma lista com até 10.000 registos.');
  const preview=previewSupplierBatch(contract,records);
  const report={...preview,warning:'Pré-visualização local apenas. Nenhuma oferta foi publicada. A autorização declarada não foi validada juridicamente.'};
  if(outputPath)writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({supplier_id:preview.supplier_id,accepted:preview.accepted_count,rejected:preview.rejected_count,published:0,mode:preview.mode},null,2));
  if(preview.rejected_count)process.exitCode=1;
 }catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=2;}
}
