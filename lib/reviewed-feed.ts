import type {ReviewCandidate} from './market-ingestion';
import {matchDream,type MarketListing,type Match} from './intelligence.ts';
import type {GarageCar} from './types';
export type ReviewedRecord={review_status:'pending'|'approved'|'rejected';payload:ReviewCandidate};
/** Feed the existing matching engine ONLY with approved, fresh, documented review records. */
export function approvedMarketListings(records:ReviewedRecord[],now=new Date()):MarketListing[]{
  return records.filter(r=>r.review_status==='approved'&&r.payload.status==='draft'&&Date.parse(r.payload.expires_at)>now.getTime())
  .map(({payload:p})=>({id:p.external_key,brand:p.brand,model:p.model,version:p.version,year:p.year,mileage_km:p.mileage_km,fuel:p.fuel,asking_price_eur:p.asking_price_eur,country:p.country,source_name:p.source_name,source_url:p.source_url,observed_at:p.observed_at,verified_at:p.verified_at,expires_at:p.expires_at}));
}
export function matchReviewedDream(dream:Pick<GarageCar,'brand'|'model'|'version'|'year_from'|'year_to'|'max_mileage_km'|'fuel'|'budget_eur'>,records:ReviewedRecord[],now=new Date()):Match[]{
  return matchDream(dream,approvedMarketListings(records,now),now);
}
