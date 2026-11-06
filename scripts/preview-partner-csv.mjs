#!/usr/bin/env node
// No API calls, database writes, or publishing. A contract declaration alone is NOT a verified license.
import {readFileSync,writeFileSync} from 'node:fs';
import {mapAuthorizedCsv} from '../lib/partner-feed.ts';
import {previewSupplierBatch} from '../lib/market-ingestion.ts';
const [contractPath,mappingPath,csvPath,outputPath]=process.argv.slice(2);
if(!contractPath||!mappingPath||!csvPath){
  console.error('Uso: node --experimental-strip-types scripts/preview-partner-csv.mjs <contract.json> <mapping.json> <export.csv> [report.json]');
  process.exitCode=2;
}else try{
  const contract=JSON.parse(readFileSync(contractPath,'utf8'));
  const mapping=JSON.parse(readFileSync(mappingPath,'utf8'));
  const parsed=mapAuthorizedCsv(readFileSync(csvPath,'utf8'),mapping);
  const preview=previewSupplierBatch(contract,parsed.rows);
  const report={...preview,parse_errors:parsed.errors,total_csv_rows:parsed.total_data_rows,warning:'DRY RUN: licença declarada não verificada juridicamente; zero anúncios importados ou publicados.'};
  if(outputPath)writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({rows:parsed.total_data_rows,parse_errors:parsed.errors.length,accepted_for_review:preview.accepted_count,rejected:preview.rejected_count,published:0},null,2));
  if(parsed.errors.length||preview.rejected_count)process.exitCode=1;
}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=2;}
