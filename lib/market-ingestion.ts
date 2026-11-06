import type {Brand, Fuel} from './types';
const BRANDS: readonly Brand[]=['Porsche','Mercedes-Benz','BMW','Audi'];

/** Supplier feeds are imported only when a signed commercial permission covers the intended use. */
export type SupplierContract = {
  supplier_id: string;
  display_name: string;
  allowed_hosts: string[];
  countries: ('DE'|'PT')[];
  permission_reference: string;
  permission_valid_until: string;
  allows_display: boolean;
  allows_price_history: boolean;
};
export type RawSupplierListing = {
  supplier_listing_id: unknown;
  brand: unknown;
  model: unknown;
  version?: unknown;
  year?: unknown;
  mileage_km?: unknown;
  fuel?: unknown;
  asking_price_eur: unknown;
  country: unknown;
  listing_url: unknown;
  observed_at: unknown;
};
export type ReviewCandidate = {
  external_key: string;
  supplier_id: string;
  supplier_listing_id: string;
  brand: Brand;
  model: string;
  version: string|null;
  year: number|null;
  mileage_km: number|null;
  fuel: Exclude<Fuel,'indiferente'>|null;
  asking_price_eur: number;
  country:'DE'|'PT';
  source_name:string;
  source_url:string;
  authorization_reference:string;
  observed_at:string;
  verified_at:string;
  expires_at:string;
  status:'draft';
};
export type RejectedListing={record_number:number; code:string; message:string};
export type ImportPreview={supplier_id:string; accepted:ReviewCandidate[]; rejected:RejectedListing[]; accepted_count:number; rejected_count:number; publishable_count:0; mode:'review_only'};
const str=(x:unknown)=>typeof x==='string'?x.trim():'';
const integer=(x:unknown,min:number,max:number):number|null=>typeof x==='number'&&Number.isInteger(x)&&x>=min&&x<=max?x:null;
const money=(x:unknown)=>typeof x==='number'&&Number.isFinite(x)&&x>0&&x<=10000000&&Math.abs(Math.round(x*100)-x*100)<1e-7?x:null;
const DATE_MS=86400000;
function safeLink(value:unknown,allowedHosts:string[]):string|null{
  const text=str(value);
  if(!text||text.length>2048)return null;
  try{
    const u=new URL(text);
    if(u.protocol!=='https:'||u.username||u.password||u.port || u.hash || !allowedHosts.includes(u.hostname.toLowerCase()))return null;
    // No local, private, or unapproved endpoints; allowedHosts must be curated by an administrator.
    if(['localhost','127.0.0.1','::1'].includes(u.hostname))return null;
    return u.toString();
  }catch{return null;}
}
function supplierIssue(contract:SupplierContract,now:Date):string|null{
  const expires=Date.parse(contract.permission_valid_until);
  if(!contract.supplier_id || !/^[a-z0-9][a-z0-9_-]{1,63}$/.test(contract.supplier_id))return 'invalid_supplier_id';
  if(!str(contract.display_name)||!str(contract.permission_reference))return 'missing_permission';
  if(!contract.allowed_hosts?.length||contract.allowed_hosts.some(h=>!h||h!==h.toLowerCase()||h.includes(':')||h.includes('/')))return 'invalid_host_allowlist';
  if(!contract.allows_display||!contract.allows_price_history)return 'permission_scope_insufficient';
  if(!Number.isFinite(expires)||expires<=now.getTime())return 'permission_expired';
  if(!contract.countries?.length || contract.countries.some(c=>c!=='DE'&&c!=='PT'))return 'invalid_countries';
  return null;
}
/** Pure preview: no network requests, DB writes or automatic public approval. */
export function previewSupplierBatch(contract:SupplierContract,items:unknown[],now=new Date()):ImportPreview{
  const accepted:ReviewCandidate[]=[],rejected:RejectedListing[]=[],seen=new Set<string>();
  const issue=supplierIssue(contract,now);
  items.forEach((row,i)=>{
    const fail=(code:string,message:string)=>rejected.push({record_number:i+1,code,message});
    if(issue){fail(issue,'O contrato de dados não autoriza esta importação.');return;}
    if(!row||typeof row!=='object'||Array.isArray(row)){fail('invalid_record','Registo inválido.');return;}
    const r=row as RawSupplierListing;
    const id=str(r.supplier_listing_id),model=str(r.model),brand=str(r.brand),url=safeLink(r.listing_url,contract.allowed_hosts);
    const year=r.year===null||r.year===undefined?null:integer(r.year,1960,2035);
    const mileage=r.mileage_km===null||r.mileage_km===undefined?null:integer(r.mileage_km,0,1000000);
    const p=money(r.asking_price_eur);
    const observed=Date.parse(str(r.observed_at));
    const fuel=r.fuel===null||r.fuel===undefined?null:str(r.fuel);
    const version=r.version===null||r.version===undefined?null:str(r.version);
    if(!id||id.length>120||!model||model.length>70||!BRANDS.includes(brand as Brand)||!url){fail('identity_invalid','Marca, modelo, identificador ou URL inválidos.');return;}
    if(!contract.countries.includes(r.country as 'DE'|'PT')){fail('country_not_licensed','País fora do contrato.');return;}
    if(p===null||year===null&&r.year!=null||mileage===null&&r.mileage_km!=null){fail('numeric_invalid','Preço, ano ou quilometragem inválidos.');return;}
    if(version!==null&&version.length>100){fail('version_invalid','Versão demasiado longa.');return;}
    if(fuel!==null&&!['gasolina','diesel','hibrido','eletrico'].includes(fuel)){fail('fuel_invalid','Combustível inválido.');return;}
    if(!Number.isFinite(observed)||observed>now.getTime()||now.getTime()-observed>7*DATE_MS){fail('observation_stale','A observação está fora da janela de sete dias.');return;}
    const external_key=contract.supplier_id+':'+id;
    if(seen.has(external_key)){fail('duplicate_in_batch','ID repetido no ficheiro.');return;}
    seen.add(external_key);
    accepted.push({external_key,supplier_id:contract.supplier_id,supplier_listing_id:id,brand:brand as Brand,model,version,year,mileage_km:mileage,fuel:fuel as ReviewCandidate['fuel'],asking_price_eur:p!,country:r.country as 'DE'|'PT',source_name:contract.display_name,source_url:url,authorization_reference:contract.permission_reference,observed_at:new Date(observed).toISOString(),verified_at:now.toISOString(),expires_at:new Date(Math.min(now.getTime()+3*DATE_MS,Date.parse(contract.permission_valid_until))).toISOString(),status:'draft'});
  });
  return {supplier_id:contract.supplier_id,accepted,rejected,accepted_count:accepted.length,rejected_count:rejected.length,publishable_count:0,mode:'review_only'};
}
