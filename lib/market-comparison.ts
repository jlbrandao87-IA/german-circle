import {validMarketListing, type MarketListing} from './intelligence.ts';
import {EXPENSE_KEYS, validMoney, type ExpenseKey} from './import-cost.ts';

/** Admin-reviewed landed-cost record linked to one German listing.
 * This is a quotation, not a statutory ISV estimator. Never infer tax exemptions.
 */
export type ImportQuote = {
  listing_id:string;
  purchase_eur:number;
  isv_eur:number|null;
  vat_eur:number|null;
  transport_eur:number|null;
  inspection_eur:number|null;
  registration_eur:number|null;
  service_eur:number|null;
  other_eur:number|null;
  source_name:string;
  source_reference:string;
  verified_at:string;
  valid_until:string;
  status:'draft'|'approved'|'withdrawn';
};
export type ComparablePair = {
  german:MarketListing;
  portuguese:MarketListing;
  quote:ImportQuote|null;
  confidence:'high'|'medium'|'low';
  reasons:string[];
  landed_eur:number|null;
  price_difference_eur:number|null;
  caveat:string;
};
const clean=(s:string|null)=> (s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const tokens=(s:string|null)=>new Set(clean(s).split(' ').filter(Boolean));
const hasExactVersion=(a:string|null,b:string|null)=>!!clean(a)&&clean(a)===clean(b);
const fuzzyVersion=(a:string|null,b:string|null)=>{
  if(!clean(a)||!clean(b))return false;
  const first=tokens(a),second=tokens(b);
  return [...first].filter(t=>second.has(t)).length/Math.max(first.size,second.size)>=0.7;
};
function moneyToCents(v:number):number{return Math.round(v*100);}
export function verifiedLandedCost(quote:ImportQuote|null, listing:MarketListing, now=new Date()):number|null{
  if(!quote || listing.country!=='DE'||quote.status!=='approved'||quote.listing_id!==listing.id)return null;
  const verified=Date.parse(quote.verified_at),until=Date.parse(quote.valid_until);
  if(!Number.isFinite(verified)||!Number.isFinite(until)||verified>now.getTime()||until<=now.getTime()||now.getTime()-verified>7*86400000)return null;
  if(!quote.source_name.trim()||!quote.source_reference.trim())return null;
  const fields:Record<ExpenseKey,number|null>={isv:quote.isv_eur,vat:quote.vat_eur,transport:quote.transport_eur,inspection:quote.inspection_eur,registration:quote.registration_eur,service:quote.service_eur,other:quote.other_eur};
  if(!validMoney(quote.purchase_eur)||quote.purchase_eur<=0||EXPENSE_KEYS.some(k=>!validMoney(fields[k])))return null;
  // Quote must use the currently displayed German asking price; otherwise the
  // landing estimate may be based on an unrelated or superseded offer.
  if(listing.asking_price_eur===null||moneyToCents(quote.purchase_eur)!==moneyToCents(listing.asking_price_eur))return null;
  return (moneyToCents(quote.purchase_eur)+EXPENSE_KEYS.reduce((sum,k)=>sum+moneyToCents(fields[k]!),0))/100;
}
export function pairComparable(de:MarketListing,pt:MarketListing,now=new Date()):{confidence:ComparablePair['confidence'];reasons:string[]}|null{
  if(de.country!=='DE'||pt.country!=='PT'||!validMarketListing(de,now)||!validMarketListing(pt,now))return null;
  if(de.brand!==pt.brand||clean(de.model)!==clean(pt.model))return null;
  if(de.id===pt.id)return null;
  // Reject ambiguous variants and markedly different age or mileage. Missing
  // metadata is low confidence, never high confidence.
  const reasons:string[]=[];
  let quality=0;
  if(de.year!==null&&pt.year!==null){const d=Math.abs(de.year-pt.year);if(d>1)return null; if(d===0){quality+=2;reasons.push('Mesmo ano');}else reasons.push('Ano adjacente');}
  else reasons.push('Ano incompleto');
  if(de.mileage_km!==null&&pt.mileage_km!==null){const d=Math.abs(de.mileage_km-pt.mileage_km);if(d>20000)return null;if(d<=10000){quality+=2;reasons.push('Quilometragem semelhante');}else reasons.push('Quilometragem aproximada');}
  else reasons.push('Quilometragem incompleta');
  if(de.fuel&&pt.fuel){if(de.fuel!==pt.fuel)return null;quality+=1;reasons.push('Mesma motorização');}
  else reasons.push('Motorização por confirmar');
  if(hasExactVersion(de.version,pt.version)){quality+=3;reasons.push('Versão declarada idêntica');}
  else if(fuzzyVersion(de.version,pt.version)){quality+=1;reasons.push('Versões similares, equipamento por verificar');}
  else reasons.push('Versão/equipamento por confirmar');
  return {confidence:quality>=8?'high':quality>=5?'medium':'low',reasons};
}
export function compareMarkets(listings:MarketListing[],quotes:ImportQuote[],now=new Date(),max=30):ComparablePair[]{
  const german=listings.filter(l=>l.country==='DE'&&validMarketListing(l,now));
  const portuguese=listings.filter(l=>l.country==='PT'&&validMarketListing(l,now));
  const quoteById=new Map(quotes.filter(q=>q.status==='approved').map(q=>[q.listing_id,q]));
  const results:ComparablePair[]=[];
  for(const de of german){
    const candidates=portuguese.flatMap(pt=>{const match=pairComparable(de,pt,now);return match?[{pt,...match}]:[];});
    // Only the best grade comparable for each German car; prevent reusing the
    // same German car to manufacture multiple apparent opportunities.
    candidates.sort((a,b)=>({high:3,medium:2,low:1}[b.confidence]-{high:3,medium:2,low:1}[a.confidence])||Math.abs((a.pt.mileage_km??0)-(de.mileage_km??0))-Math.abs((b.pt.mileage_km??0)-(de.mileage_km??0)));
    const candidate=candidates[0];if(!candidate)continue;
    const landed=verifiedLandedCost(quoteById.get(de.id)??null,de,now);
    // Comparable pricing is only persuasive for exact version, year,
    // motorização and sufficiently close mileage; otherwise do not claim a saving.
    const qualified=candidate.confidence==='high'&&landed!==null;
    const delta=qualified?Math.round(((candidate.pt.asking_price_eur??0)-landed)*100)/100:null;
    results.push({german:de,portuguese:candidate.pt,quote:quoteById.get(de.id)??null,
      confidence:candidate.confidence,reasons:candidate.reasons,landed_eur:landed,
      price_difference_eur:delta,
      caveat:!landed?'Custos de importação ainda não confirmados':candidate.confidence!=='high'?'Comparação indicativa: configuração e equipamento exigem validação':'Diferença entre preços pedidos; não representa poupança garantida nem preço de venda efetivo'});
  }
  return results.sort((a,b)=>(b.price_difference_eur!==null?1:0)-(a.price_difference_eur!==null?1:0)||
    (b.price_difference_eur??-Infinity)-(a.price_difference_eur??-Infinity)).slice(0,max);
}
