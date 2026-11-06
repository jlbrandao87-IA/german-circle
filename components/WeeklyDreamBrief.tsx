'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';
import {createWeeklyBrief} from '../lib/weekly-brief';
import type {GarageCar} from '../lib/types';
import {euro} from '../lib/types';
import type {MarketListing} from '../lib/intelligence';
import type {PriceObservation} from '../lib/watchlist';

type Props={dreams:GarageCar[]};
export function WeeklyDreamBrief({dreams}:Props){
  const api=useMemo(()=>supabase(),[]);
  const [listings,setListings]=useState<MarketListing[]>([]);
  const [history,setHistory]=useState<PriceObservation[]>([]);
  const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    if(!api){setState('error');return;}
    let alive=true;
    const load=async()=>{
      const [l,h]=await Promise.all([
        api.from('market_listings').select('id,brand,model,version,year,mileage_km,fuel,asking_price_eur,country,source_name,source_url,observed_at,verified_at,expires_at').eq('status','approved').gt('expires_at',new Date().toISOString()).order('verified_at',{ascending:false}).limit(250),
        api.from('market_price_observations').select('listing_id,price_eur,observed_at').order('observed_at',{ascending:false}).limit(1000)
      ]);
      if(!alive)return;
      if(l.error||h.error){setState('error');return;}
      setListings((l.data||[]) as MarketListing[]);
      setHistory((h.data||[]).map(v=>({listing_id:v.listing_id,price_eur:Number(v.price_eur),observed_at:v.observed_at})));
      setState('ready');
    };
    void load();return()=>{alive=false;};
  },[api,refresh]);
  const brief=createWeeklyBrief(dreams,listings,history,new Date(),listings.length===250||history.length===1000);
  return <section className="intelligence-section weekly-brief" aria-labelledby="weekly-brief-title">
    <div className="intelligence-head"><p className="eyebrow">GERMAN INTELLIGENCE · WEEKLY BRIEF</p><h2 id="weekly-brief-title">A semana dos seus sonhos</h2><p>Um resumo individual, gerado a partir de anúncios aprovados e observações documentadas.</p></div>
    {state==='loading'?<p role="status">A preparar o resumo da semana…</p>:state==='error'?<div className="intelligence-empty" role="alert"><p>Não foi possível consultar as fontes nesta sessão.</p><button type="button" onClick={()=>{setState('loading');setRefresh(n=>n+1);}}>Tentar novamente</button></div>:!dreams.length?<div className="intelligence-empty">Adicione o primeiro automóvel à Dream Garage para receber o seu resumo.</div>:<>
      <div className="weekly-brief-stat"><div><strong>{brief.totalMatching}</strong><small>Correspondências ativas*</small></div><div><strong>{brief.totalNew}</strong><small>Novas na semana*</small></div><div><strong>{brief.totalChanges}</strong><small>Alterações relevantes*</small></div></div>
      <p className="weekly-brief-date">Período: {new Date(brief.windowStart).toLocaleDateString('pt-PT')} – {new Date(brief.asOf).toLocaleDateString('pt-PT')}</p>
      <div className="weekly-brief-grid">{brief.dreams.map(d=><article className="weekly-dream" key={d.dreamId}>
        <div className="weekly-dream-heading"><h3>{d.name}</h3><span>{d.activeCount} correspondência(s)</span></div>
        {d.coverage==='none'?<p>Não há anúncios autorizados e verificados compatíveis neste momento. Isto não significa que o automóvel não exista no mercado.</p>:<><p>{d.newlyVerified} anúncio(s) observado(s) pela primeira vez nos últimos sete dias. {d.priceChanges.length?`${d.priceChanges.length} alteração(ões) de preço de pelo menos 3%.`:'Nenhuma alteração relevante documentada na amostra.'}</p>
          {d.bestMatches.length>0&&<div className="weekly-dream-items">{d.bestMatches.map(l=><div key={l.id}><span>{l.year??'Ano não indicado'} · {l.country==='DE'?'Alemanha':'Portugal'} · {l.source_name}</span><strong>{l.asking_price_eur?euro(l.asking_price_eur):'Preço indisponível'}</strong><a href={l.source_url} target="_blank" rel="noopener noreferrer">Fonte ↗</a></div>)}</div>}
          {d.priceChanges.slice(0,2).map(change=><p className="weekly-price-change" key={change.listing.id}>{change.direction==='drop'?'↓ Descida':'↑ Subida'} de {Math.abs(change.changePct).toFixed(1)}%: {euro(change.previous)} → {euro(change.latest)} · {change.listing.source_name}</p>)}
        </>}
      </article>)}</div>
      {brief.limited&&<p className="weekly-brief-warning" role="status">Resumo parcial: o limite de registos consultados foi atingido. Não representa a cobertura integral do mercado.</p>}
    </>}
    <p className="intelligence-disclaimer">* Totais de correspondências por sonho, não de veículos únicos. Os preços são pedidos em anúncios, não valores de transação. As fontes são limitadas às integrações autorizadas disponíveis; nenhum fornecedor externo está ligado por padrão. Este resumo não constitui avaliação, previsão ou cálculo final de importação. Não há envio automático por email nem texto gerado por IA nesta versão.</p>
  </section>;
}
