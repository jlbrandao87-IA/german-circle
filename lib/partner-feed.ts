/** Deterministic, offline mapping of a supplier-authorized CSV export.
 * Never reaches a provider, authenticates, writes to a database, or publishes.
 */
import type {RawSupplierListing} from './market-ingestion';

export type ColumnMap = {
  supplier_listing_id:string; brand:string; model:string; version?:string;
  year?:string; mileage_km?:string; fuel?:string; asking_price_eur:string;
  country:string; listing_url:string; observed_at:string;
};
export type FeedMapping = {
  columns:ColumnMap;
  brand_aliases?:Record<string,string>;
  fuel_aliases?:Record<string,string>;
  country_aliases?:Record<string,string>;
  decimal_separator?:'.'|',';
};
export type FeedParseResult={rows:RawSupplierListing[]; errors:{line:number;code:string}[]; total_data_rows:number};

function parseCsv(input:string):{cells:string[][];error:string|null}{
  const table:string[][]=[];let row:string[]=[],field='',quoted=false,closed=false;
  // CSV with escaped quotes, CRLF and embedded newlines. Deliberately fail closed.
  for(let i=0;i<input.length;i++){
    const c=input[i];
    if(quoted){
      if(c==='"'&&input[i+1]==='"'){field+='"';i++;}
      else if(c==='"'){quoted=false;closed=true;}
      else field+=c;
    }else if(c==='"'){
      if(field!==''||closed)return {cells:[],error:'invalid_quote'};
      quoted=true;
    }else if(c===','){
      row.push(field);field='';closed=false;
    }else if(c==='\n'||c==='\r'){
      if(c==='\r'&&input[i+1]==='\n')i++;
      row.push(field);table.push(row);row=[];field='';closed=false;
    }else{
      if(closed)return {cells:[],error:'invalid_quote'};
      field+=c;
    }
  }
  if(quoted)return {cells:[],error:'unclosed_quote'};
  if(field!==''||row.length||closed){row.push(field);table.push(row);}
  return {cells:table,error:null};
}
const text=(s:unknown)=>typeof s==='string'?s.trim():'';
const allowedFields=['supplier_listing_id','brand','model','version','year','mileage_km','fuel','asking_price_eur','country','listing_url','observed_at'] as const;
function numeric(raw:string,decimal:'.'|','):number|undefined{
  const v=raw.trim();
  if(!v)return undefined;
  if(decimal===','&&!/^\d+(?:,\d{1,2})?$/.test(v))return undefined;
  if(decimal==='.'&&!/^\d+(?:\.\d{1,2})?$/.test(v))return undefined;
  const n=Number(decimal===','?v.replace(',','.'):v);
  return Number.isFinite(n)?n:undefined;
}
function whole(raw:string):number|undefined{
  const v=raw.trim();return /^\d+$/.test(v)?Number(v):undefined;
}
/** Treat the supplier export as untrusted. All inputs still pass previewSupplierBatch. */
export function mapAuthorizedCsv(csv:string,mapping:FeedMapping,maxRecords=10000):FeedParseResult{
  if(typeof csv!=='string'||Buffer.byteLength(csv,'utf8')>4*1024*1024)throw Error('feed_too_large');
  if(!mapping||!mapping.columns||!['.',','].includes(mapping.decimal_separator??'.'))throw Error('invalid_mapping');
  const parsed=parseCsv(csv.replace(/^\uFEFF/,''));
  if(parsed.error)throw Error(parsed.error);
  const [head,...data]=parsed.cells;
  if(!head?.length)throw Error('header_missing');
  if(new Set(head).size!==head.length)throw Error('duplicate_header');
  if(data.length>maxRecords)throw Error('too_many_rows');
  const required=['supplier_listing_id','brand','model','asking_price_eur','country','listing_url','observed_at'] as const;
  for(const key of required)if(!text(mapping.columns[key]))throw Error('missing_required_mapping:'+key);
  for(const key of allowedFields){const col=mapping.columns[key];if(col&&!head.includes(col))throw Error('unknown_column:'+col);}
  const errors:{line:number;code:string}[]=[],rows:RawSupplierListing[]=[];
  for(let i=0;i<data.length;i++){
    const line=i+2,values=data[i];
    if(values.length===1&&!values[0].trim())continue;
    if(values.length!==head.length){errors.push({line,code:'column_count_mismatch'});continue;}
    const get=(key:keyof ColumnMap)=>text(mapping.columns[key]?values[head.indexOf(mapping.columns[key]!)]:undefined);
    const lookup=(value:string,aliases?:Record<string,string>)=>aliases?.[value]??value;
    const price=numeric(get('asking_price_eur'),mapping.decimal_separator??'.');
    const rawYear=get('year'),rawKm=get('mileage_km');
    const year=rawYear?whole(rawYear):null,km=rawKm?whole(rawKm):null;
    if(price===undefined||(rawYear&&year===undefined)||(rawKm&&km===undefined)){
      errors.push({line,code:'number_parse_failed'});continue;
    }
    rows.push({supplier_listing_id:get('supplier_listing_id'),brand:lookup(get('brand'),mapping.brand_aliases),model:get('model'),version:get('version')||null,year:year??null,mileage_km:km??null,fuel:lookup(get('fuel'),mapping.fuel_aliases)||null,asking_price_eur:price,country:lookup(get('country'),mapping.country_aliases),listing_url:get('listing_url'),observed_at:get('observed_at')});
  }
  return {rows,errors,total_data_rows:data.length};
}
