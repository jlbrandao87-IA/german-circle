import {matchDream, type MarketListing} from './intelligence.ts';
import {observationSeries, priceAlert, priceTrend, type PriceObservation} from './watchlist.ts';
import type {GarageCar} from './types.ts';

export type WeeklyChange={listing:MarketListing;direction:'drop'|'rise';changePct:number;previous:number;latest:number};
export type DreamWeeklyBrief={dreamId:string;name:string;activeCount:number;newlyVerified:number;priceChanges:WeeklyChange[];bestMatches:MarketListing[];coverage:'available'|'none';};
export type WeeklyBrief={asOf:string;windowStart:string;totalMatching:number;totalNew:number;totalChanges:number;dreams:DreamWeeklyBrief[];limited:boolean};
/** Deterministic, source-backed summary; never infers savings from asking prices. */
export function createWeeklyBrief(dreams:GarageCar[],listings:MarketListing[],observations:PriceObservation[],now=new Date(),limited=false):WeeklyBrief{
  const start=new Date(now.getTime()-7*86400000);
  const eligibleDreams=dreams.filter(d=>d.kind==='dream').slice().sort((a,b)=>a.priority-b.priority).slice(0,5);
  const briefs=eligibleDreams.map(dream=>{
    const matches=matchDream(dream,listings,now);
    const newMatches=matches.filter(({listing})=>{
      const t=Date.parse(listing.observed_at);
      return t>=start.getTime()&&t<=now.getTime();
    });
    const changes:WeeklyChange[]=matches.flatMap(({listing})=>{
      const series=observationSeries(listing.id,observations).filter(o=>Date.parse(o.observed_at)<=now.getTime());
      const trend=priceTrend(series,now);
      const alert=priceAlert(trend,3);
      if(!trend||!alert||Date.parse(trend.last_seen)<start.getTime()||trend.previous===null||trend.change_pct===null)return [];
      return [{listing,direction:alert,changePct:trend.change_pct,previous:trend.previous,latest:trend.latest}];
    }).sort((a,b)=>Math.abs(b.changePct)-Math.abs(a.changePct));
    return {dreamId:dream.id,name:`${dream.brand} ${dream.model}`,activeCount:matches.length,newlyVerified:newMatches.length,priceChanges:changes,bestMatches:matches.slice(0,2).map(m=>m.listing),coverage:matches.length?'available':'none'} satisfies DreamWeeklyBrief;
  });
  return {asOf:now.toISOString(),windowStart:start.toISOString(),totalMatching:briefs.reduce((v,d)=>v+d.activeCount,0),totalNew:briefs.reduce((v,d)=>v+d.newlyVerified,0),totalChanges:briefs.reduce((v,d)=>v+d.priceChanges.length,0),dreams:briefs,limited};
}
