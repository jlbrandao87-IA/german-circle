'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import type {User} from '@supabase/supabase-js';
import type {MarketListing} from '../lib/intelligence';
import {listingStillCurrent,observationSeries,priceAlert,priceTrend,type PriceObservation} from '../lib/watchlist';
import {euro} from '../lib/types';
import {supabase} from '../lib/supabase';

type Props={user:User};
export function MemberWatchlist({user}:Props){
  const [listings,setListings]=useState<MarketListing[]>([]);
  const api=useMemo(()=>supabase(),[]);
  const [saved,setSaved]=useState<string[]>([]);
  const [history,setHistory]=useState<PriceObservation[]>([]);
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [changing,setChanging]=useState<string|null>(null);
  const [message,setMessage]=useState('');
  const load=useCallback(async()=>{
    if(!api)return;
    const [w,h,l]=await Promise.all([
      api.from('member_watchlists').select('listing_id').eq('owner_id',user.id).limit(100),
      api.from('market_price_observations').select('listing_id,price_eur,observed_at').order('observed_at',{ascending:false}).limit(1000),
      api.from('market_listings').select('id,brand,model,version,year,mileage_km,fuel,asking_price_eur,country,source_name,source_url,observed_at,verified_at,expires_at').eq('status','approved').gt('expires_at',new Date().toISOString()).limit(250)
    ]);
    if(w.error||h.error||l.error){setStatus('error');return;}
    setSaved((w.data||[]).map(row=>row.listing_id));
    setListings((l.data||[]) as MarketListing[]);
    setHistory((h.data||[]).map(row=>({listing_id:row.listing_id,price_eur:Number(row.price_eur),observed_at:row.observed_at})));
    setStatus('ready');
  },[api,user.id]);
  useEffect(()=>{void load();},[load]);
  const map=new Map(listings.map(item=>[item.id,item]));
  const visible=saved.map(id=>map.get(id)).filter((item):item is MarketListing=>listingStillCurrent(item));
  const unavailable=saved.length-visible.length;
  async function toggle(id:string){
    if(!api||changing)return;
    setChanging(id);setMessage('');
    const wasSaved=saved.includes(id);
    const result=wasSaved
      ?await api.from('member_watchlists').delete().eq('owner_id',user.id).eq('listing_id',id)
      :await api.from('member_watchlists').insert({owner_id:user.id,listing_id:id});
    if(result.error){setMessage('Não foi possível atualizar a lista. Tente novamente.');}
    else setSaved(previous=>wasSaved?previous.filter(item=>item!==id):[...previous,id]);
    setChanging(null);
  }
  return <section className="intelligence-section" aria-labelledby="watchlist-title">
    <div className="intelligence-head"><div><p className="eyebrow">YOUR PRIVATE WATCHLIST · EARLY ACCESS</p><h2 id="watchlist-title">Os automóveis que acompanha</h2><p>Guarde anúncios verificados e acompanhe as alterações de preço observadas.</p></div></div>
    {status==='loading'?<p role="status">A carregar watchlist privada…</p>:status==='error'?<div className="intelligence-empty" role="alert">Não foi possível carregar a watchlist. <button type="button" onClick={()=>{setStatus('loading');void load();}}>Tentar novamente</button></div>:<>
      {!!message&&<p role="alert" className="notice">{message}</p>}
      {unavailable>0&&<div className="intelligence-empty" role="status">{unavailable} anúncio(s) guardado(s) já não estão disponíveis ou suficientemente atualizados. Permanecem associados à sua lista até os remover, mas não são apresentados como ofertas ativas.</div>}
      {visible.length===0?<div className="intelligence-empty"><strong>Ainda não acompanha nenhuma oportunidade ativa.</strong><p>Selecione «Acompanhar» numa oportunidade verificada para a guardar aqui.</p></div>:<div className="intelligence-results">
        {visible.map(item=>{
          const trend=priceTrend(observationSeries(item.id,history));const alert=priceAlert(trend,3);
          return <article className="intelligence-result" key={item.id}><div>
            <strong>{item.brand} {item.model} {item.version||''}</strong>
            <p>{item.year??'Ano por confirmar'} · {item.country==='DE'?'Alemanha':'Portugal'} · {item.mileage_km===null?'Quilometragem indisponível':item.mileage_km.toLocaleString('pt-PT')+' km'}</p>
            <small>Fonte: {item.source_name} · Verificado a {new Date(item.verified_at).toLocaleDateString('pt-PT')}</small>
            {trend&&trend.observations>=2?<small>{alert==='drop'?'↓ Descida de preço observada':alert==='rise'?'↑ Subida de preço observada':'Variação registada'}: {trend.change_eur!==null?`${euro(trend.change_eur)} (${trend.change_pct?.toFixed(1)}%)`:'—'} · {trend.observations} registos</small>:<small>Histórico insuficiente para inferir tendência de preço</small>}
          </div><div className="intelligence-result-action"><strong>{euro(item.asking_price_eur!)}</strong><small>Preço pedido, sem custos de importação</small><a href={item.source_url} target="_blank" rel="noopener noreferrer">Consultar fonte ↗</a><button type="button" onClick={()=>void toggle(item.id)} disabled={changing===item.id}>Deixar de acompanhar</button></div></article>;
        })}
      </div>}
    </>}
    <p className="intelligence-disclaimer">Alertas exibidos apenas nesta página: não enviamos emails ou notificações automáticas. As alterações são calculadas a partir de observações reais autorizadas, se existirem. Não constituem recomendação de investimento nem indicam o custo total de importação.</p>
  </section>;
}
export function WatchButton({listingId,userId,onChanged}:{listingId:string;userId:string;onChanged?:()=>void}){
  const api=useMemo(()=>supabase(),[]);
  const [saved,setSaved]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{let active=true;if(!api)return;api.from('member_watchlists').select('listing_id').eq('owner_id',userId).eq('listing_id',listingId).maybeSingle().then(({data})=>{if(active)setSaved(!!data);});return()=>{active=false;};},[api,userId,listingId]);
  async function toggle(){if(!api)return;setBusy(true);setError('');const result=saved?await api.from('member_watchlists').delete().eq('owner_id',userId).eq('listing_id',listingId):await api.from('member_watchlists').insert({owner_id:userId,listing_id:listingId});if(result.error)setError('Erro ao guardar');else{setSaved(!saved);onChanged?.();}setBusy(false);}
  return <span><button type="button" disabled={busy} onClick={()=>void toggle()} aria-pressed={saved}>{saved?'✓ A acompanhar':'+ Acompanhar'}</button>{error&&<small role="alert">{error}</small>}</span>;
}
