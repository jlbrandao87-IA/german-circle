import {createHash} from 'node:crypto';
import type {ReviewCandidate} from './market-ingestion';

/** Canonical checksum, independent of JSON property ordering and batch metadata. */
export function canonicalListing(candidate:ReviewCandidate):string {
  const fields = ['supplier_id','supplier_listing_id','brand','model','version','year','mileage_km','fuel','asking_price_eur','country','source_url','observed_at'] as const;
  return JSON.stringify(fields.map(k=>candidate[k]));
}
export function candidateChecksum(candidate:ReviewCandidate):string{
  return createHash('sha256').update(canonicalListing(candidate)).digest('hex');
}
export type QueueRow = {
  supplier_id:string;
  supplier_listing_id:string;
  payload:ReviewCandidate;
  payload_checksum:string;
  review_status:'pending';
};
export function queueRows(accepted:ReviewCandidate[]):QueueRow[]{
  return accepted.map(item=>({supplier_id:item.supplier_id,supplier_listing_id:item.supplier_listing_id,payload:item,payload_checksum:candidateChecksum(item),review_status:'pending'}));
}
export function safeImportAudit(input:{actor_id:string;supplier_id:string;batch_rows:number;accepted:number;rejected:number;inserted:number;duplicate:number;error_code?:string}) {
  const {actor_id,supplier_id,batch_rows,accepted,rejected,inserted,duplicate,error_code}=input;
  return {actor_id,supplier_id,batch_rows,accepted,rejected,inserted,duplicate,error_code:error_code??null};
}
