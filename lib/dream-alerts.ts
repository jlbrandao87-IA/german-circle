import {matchDream, type MarketListing} from './intelligence.ts';
import {observationSeries,priceAlert,priceTrend,type PriceObservation} from './watchlist.ts';
import type {GarageCar} from './types.ts';

export type AlertFrequency='off'|'weekly'|'daily';
export type AlertSettings={frequency:AlertFrequency;min_drop_pct:number;include_new_matches:boolean;include_price_drops:boolean};
export type DreamAlert={key:string;dream_id:string;dream_name:string;listing_id:string;source_url:string;source_name:string;country:'DE'|'PT';kind:'new_match'|'price_drop';observed_at:string;price_eur:number;change_pct:number|null};
export const DEFAULT_ALERT_SETTINGS:AlertSettings={frequency:'weekly',min_drop_pct:3,include_new_matches:true,include_price_drops:true};

export function validAlertSettings(value:AlertSettings):boolean{
  return ['off','weekly','daily'].includes(value.frequency)&&Number.isFinite(value.min_drop_pct)&&value.min_drop_pct>=1&&value.min_drop_pct<=30&&typeof value.include_new_matches==='boolean'&&typeof value.include_price_drops==='boolean';
}
/** Preview only. Uses approved, current data already loaded from the database; does not send notifications. */
export function collectDreamAlerts(dreams:GarageCar[],listings:MarketListing[],history:PriceObservation[],settings:AlertSettings,now=new Date()):DreamAlert[]{
  if(!validAlertSettings(settings)||settings.frequency==='off')return [];
  const interval=settings.frequency==='daily'?86400000:7*86400000;
  const start=now.getTime()-interval;
  const alerts:DreamAlert[]=[];
  const dedupe=new Set<string>();
  for(const dream of dreams.filter(d=>d.kind==='dream').slice().sort((a,b)=>a.priority-b.priority).slice(0,5)){
    for(const {listing} of matchDream(dream,listings,now)){
      const name=`${dream.brand} ${dream.model}`;
      const seen=Date.parse(listing.observed_at);
      if(settings.include_new_matches&&seen>=start&&seen<=now.getTime()){
        const key=`${dream.id}:${listing.id}:new`;
        if(!dedupe.has(key)){dedupe.add(key);alerts.push({key,dream_id:dream.id,dream_name:name,listing_id:listing.id,source_url:listing.source_url,source_name:listing.source_name,country:listing.country,kind:'new_match',observed_at:listing.observed_at,price_eur:listing.asking_price_eur!,change_pct:null});}
      }
      if(settings.include_price_drops){
        const trend=priceTrend(observationSeries(listing.id,history),now);
        if(trend&&priceAlert(trend,settings.min_drop_pct)==='drop'&&Date.parse(trend.last_seen)>=start){
          const key=`${dream.id}:${listing.id}:drop:${trend.last_seen}`;
          if(!dedupe.has(key)){dedupe.add(key);alerts.push({key,dream_id:dream.id,dream_name:name,listing_id:listing.id,source_url:listing.source_url,source_name:listing.source_name,country:listing.country,kind:'price_drop',observed_at:trend.last_seen,price_eur:trend.latest,change_pct:trend.change_pct});}
        }
      }
    }
  }
  return alerts.sort((a,b)=>Date.parse(b.observed_at)-Date.parse(a.observed_at)).slice(0,100);
}
export function formatAlertDigest(alerts:DreamAlert[],settings:AlertSettings,asOf=new Date()):string{
  const timestamp=asOf.toISOString().slice(0,10);
  const title=`German Circle — Dream Alerts (${timestamp})`;
  if(settings.frequency==='off')return `${title}\nAlertas desativados.`;
  if(!alerts.length)return `${title}\nNenhuma alteração identificada na amostra de anúncios autorizados disponível. Isto não representa o mercado completo.`;
  return [title,...alerts.map(a=>`${a.dream_name}: ${a.kind==='price_drop'?`descida de ${Math.abs(a.change_pct??0).toFixed(1)}%`:'novo anúncio observado'} · ${a.country} · ${a.price_eur.toLocaleString('pt-PT',{style:'currency',currency:'EUR'})} · ${a.source_name}\n${a.source_url}`),'Preços anunciados; não representam custo final de importação, preço de transação ou poupança comprovada. Cobertura limitada às fontes autorizadas.'].join('\n\n');
}
