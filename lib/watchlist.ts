import type {MarketListing} from './intelligence';

export type PriceObservation={listing_id:string;price_eur:number;observed_at:string};
export type PriceTrend={latest:number;previous:number|null;change_eur:number|null;change_pct:number|null;observations:number;last_seen:string};
/** Observations are authoritative, reviewed snapshots. Never manufacture history from one asking price. */
export function priceTrend(items:PriceObservation[],now=new Date()):PriceTrend|null {
  const clean=items.filter(o=>Number.isFinite(o.price_eur)&&o.price_eur>0&&Number.isFinite(Date.parse(o.observed_at))&&Date.parse(o.observed_at)<=now.getTime()).sort((a,b)=>Date.parse(a.observed_at)-Date.parse(b.observed_at));
  if(!clean.length)return null;
  const latest=clean[clean.length-1],previous=clean.length>1?clean[clean.length-2]:null;
  const change=previous?latest.price_eur-previous.price_eur:null;
  return {latest:latest.price_eur,previous:previous?.price_eur??null,change_eur:change,change_pct:previous&&change!==null?100*change/previous.price_eur:null,observations:clean.length,last_seen:latest.observed_at};
}
export function priceAlert(trend:PriceTrend|null,thresholdPct=3):'drop'|'rise'|null {
  if(!trend||trend.change_pct===null||!Number.isFinite(thresholdPct)||thresholdPct<=0)return null;
  return trend.change_pct<=-thresholdPct?'drop':trend.change_pct>=thresholdPct?'rise':null;
}
export function listingStillCurrent(listing:MarketListing|undefined,now=new Date()):boolean {
  return !!listing && Date.parse(listing.expires_at)>now.getTime() && Date.parse(listing.verified_at)<=now.getTime() && now.getTime()-Date.parse(listing.verified_at)<=7*86400000;
}
export const observationSeries=(listingId:string,observations:PriceObservation[])=>observations.filter(o=>o.listing_id===listingId);
