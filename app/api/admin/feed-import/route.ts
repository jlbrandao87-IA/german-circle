import {NextRequest,NextResponse} from 'next/server';
import {adminFromRequest} from '../../../../lib/server/admin';
import {mapAuthorizedCsv, type FeedMapping} from '../../../../lib/partner-feed';
import {previewSupplierBatch, type SupplierContract} from '../../../../lib/market-ingestion';
import {queueRows,safeImportAudit} from '../../../../lib/ingestion-batch';
import {readBoundedJson} from '../../../../lib/server/bounded-json';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const MAX_BYTES=4*1024*1024;
const respond=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});

/** Server-only ingest. Client supplies a supplier id, NOT contractual permissions. */
export async function POST(request:NextRequest){
  const admin=await adminFromRequest(request);
  if(!admin)return respond({error:'unauthorized'},401);
  let payload:{supplier_id?:unknown;csv?:unknown;mapping?:FeedMapping};
  try{payload=await readBoundedJson(request,MAX_BYTES) as typeof payload;}catch(error){return respond({error:(error as Error).message==='payload_too_large'?'payload_too_large':'invalid_json'},(error as Error).message==='payload_too_large'?413:400);}
  if(!payload||typeof payload.supplier_id!=='string'||!/^[-a-z0-9_]{2,64}$/.test(payload.supplier_id)||typeof payload.csv!=='string'||Buffer.byteLength(payload.csv,'utf8')>MAX_BYTES)return respond({error:'invalid_payload'},400);
  const {data:supplier,error:fetchError}=await admin.db.from('market_suppliers').select('*').eq('id',payload.supplier_id).eq('enabled',true).maybeSingle();
  if(fetchError)return respond({error:'supplier_lookup_failed'},503);
  if(!supplier)return respond({error:'supplier_not_approved'},403);
  // Contract information is exclusively loaded from the privileged database.
  const contract:SupplierContract={supplier_id:supplier.id,display_name:supplier.display_name,permission_reference:supplier.permission_reference,permission_valid_until:supplier.permission_valid_until,allowed_hosts:supplier.allowed_hosts,countries:supplier.allowed_countries,allows_display:supplier.allows_display,allows_price_history:supplier.allows_price_history};
  let parsed;
  try{parsed=mapAuthorizedCsv(payload.csv,payload.mapping as FeedMapping,1000);}catch{return respond({error:'feed_parse_failed'},422);}
  const preview=previewSupplierBatch(contract,parsed.rows);
  const rejected=parsed.errors.length+preview.rejected_count;
  if(preview.accepted_count===0)return respond({supplier_id:contract.supplier_id,accepted:0,rejected,queued:0,duplicates:0,mode:'review_only',parse_errors:parsed.errors,validation_errors:preview.rejected});
  const rows=queueRows(preview.accepted);
  const {data:written,error:writeError}=await admin.db.from('market_import_review_queue').upsert(rows,{onConflict:'supplier_id,supplier_listing_id,payload_checksum',ignoreDuplicates:true}).select('id');
  if(writeError)return respond({error:'queue_write_failed'},503);
  const queued=written?.length??0;
  const audit=safeImportAudit({actor_id:admin.id,supplier_id:contract.supplier_id,batch_rows:parsed.total_data_rows,accepted:preview.accepted_count,rejected,inserted:queued,duplicate:rows.length-queued});
  const {error:auditError}=await admin.db.from('market_import_audit').insert(audit);
  if(auditError)return respond({error:'audit_write_failed',queue_may_have_changed:true},503);
  return respond({supplier_id:contract.supplier_id,accepted:preview.accepted_count,rejected,queued,duplicates:rows.length-queued,published:0,mode:'review_only',parse_errors:parsed.errors,validation_errors:preview.rejected});
}
