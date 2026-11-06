import type {Brand, Fuel, GarageCar} from './types';

/** A candidate can be considered only with human-reviewed, licensed/authorized provenance. */
export type MarketListing = {
  id:string; brand:Brand; model:string; version:string|null; year:number|null;
  mileage_km:number|null; fuel:Fuel|null; asking_price_eur:number|null;
  country:'DE'|'PT'; source_name:string; source_url:string;
  observed_at:string; expires_at:string; verified_at:string;
};
export type Match = {listing:MarketListing;score:number;reasons:string[]};

export const MODEL_CATALOG:Readonly<Record<Brand,readonly string[]>> = {
  Porsche:['911','718 Cayman','718 Boxster','Macan','Cayenne','Panamera','Taycan'],
  'Mercedes-Benz':['Classe A','Classe C','Classe E','Classe S','CLA','GLA','GLB','GLC','GLE','GLS','AMG GT','Classe G'],
  BMW:['Série 1','Série 2','Série 3','Série 4','Série 5','Série 7','X1','X3','X5','X6','X7','i4','i5','iX','M2','M3','M4'],
  Audi:['A3','A4','A5','A6','A7','A8','Q3','Q5','Q7','Q8','e-tron GT','RS3','RS4','RS6']
};
const clean=(x:string)=>x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const modelCompatible=(wanted:string,offered:string)=>{
  const a=clean(wanted), b=clean(offered);
  return a.length>0 && (a===b || b.startsWith(a+' '));
};
export function validMarketListing(item:MarketListing, now=new Date()):boolean {
  const observed=Date.parse(item.observed_at), expires=Date.parse(item.expires_at), verified=Date.parse(item.verified_at);
  if(!Number.isFinite(observed)||!Number.isFinite(expires)||!Number.isFinite(verified))return false;
  if(observed>now.getTime() || verified>now.getTime() || expires<=now.getTime())return false;
  if(expires<=observed || now.getTime()-verified>7*86400000)return false;
  if(!['DE','PT'].includes(item.country))return false;
  if(!item.source_name?.trim() || !item.source_url?.startsWith('https://'))return false;
  try{if(new URL(item.source_url).protocol!=='https:')return false;}catch{return false;}
  if(item.asking_price_eur===null || !Number.isFinite(item.asking_price_eur)||item.asking_price_eur<=0)return false;
  return true;
}
export function matchDream(dream:Pick<GarageCar,'brand'|'model'|'version'|'year_from'|'year_to'|'max_mileage_km'|'fuel'|'budget_eur'>, listings:MarketListing[],now=new Date()):Match[]{
  return listings.flatMap(listing=>{
    if(!validMarketListing(listing,now) || listing.brand!==dream.brand || !modelCompatible(dream.model,listing.model))return [];
    if(dream.year_from!==null&&(listing.year===null||listing.year<dream.year_from))return [];
    if(dream.year_to!==null&&(listing.year===null||listing.year>dream.year_to))return [];
    if(dream.max_mileage_km!==null&&(listing.mileage_km===null||listing.mileage_km>dream.max_mileage_km))return [];
    if(dream.fuel!=='indiferente'&&(listing.fuel===null||dream.fuel!==listing.fuel))return [];
    // Budget is for a complete landed price, not a raw German asking price.
    // Never filter DE listings using the budget until import duties are calculated.
    if(dream.budget_eur!==null && listing.country==='PT' && (listing.asking_price_eur===null || listing.asking_price_eur>dream.budget_eur))return [];
    const reasons=['Marca e modelo compatíveis'];
    let score=60;
    if(dream.version && listing.version && clean(listing.version).includes(clean(dream.version))){score+=15;reasons.push('Versão preferida');}
    if(dream.year_from!==null && listing.year!==null){score+=10;reasons.push('Ano pretendido');}
    if(dream.max_mileage_km!==null && listing.mileage_km!==null){score+=10;reasons.push('Quilometragem compatível');}
    if(dream.fuel!=='indiferente'){score+=5;reasons.push('Motorização compatível');}
    return [{listing,score,reasons}];
  }).sort((a,b)=>b.score-a.score || a.listing.asking_price_eur!-b.listing.asking_price_eur!);
}
