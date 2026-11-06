'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';
import {compareMarkets,type ImportQuote} from '../lib/market-comparison';
import {validMarketListing,type MarketListing} from '../lib/intelligence';
import {euro} from '../lib/types';

export function MarketComparison(){
  const [listings,setListings]=useState<MarketListing[]>([]);
  const [quotes,setQuotes]=useState<ImportQuote[]>([]);
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [filter,setFilter]=useState<'all'|'priced'>('all');
  useEffect(()=>{
    const api=supabase();if(!api){setStatus('error');return;}
    let active=true;
    async function load(){
      const [l,q]=await Promise.all([
        api!.from('market_listings').select('id,brand,model,version,year,mileage_km,fuel,asking_price_eur,country,source_name,source_url,observed_at,verified_at,expires_at').eq('status','approved').gt('expires_at',new Date().toISOString()).limit(500),
        api!.from('market_import_quotes').select('listing_id,purchase_eur,isv_eur,vat_eur,transport_eur,inspection_eur,registration_eur,service_eur,other_eur,source_name,source_reference,verified_at,valid_until,status').eq('status','approved').limit(500)
      ]);
      if(!active)return;
      if(l.error||q.error){setStatus('error');return;}
      setListings((l.data??[]) as MarketListing[]);setQuotes((q.data??[]) as ImportQuote[]);setStatus('ready');
    }
    void load();return()=>{active=false;};
  },[]);
  const pairs=useMemo(()=>compareMarkets(listings.filter(l=>validMarketListing(l)),quotes),[listings,quotes]);
  const displayed=filter==='priced'?pairs.filter(p=>p.price_difference_eur!==null):pairs;
  return <section className="intelligence-section" aria-labelledby="market-comparison-title">
    <div className="intelligence-head"><div><p className="eyebrow">GERMAN INTELLIGENCE · MARKET COMPARISON</p><h2 id="market-comparison-title">Alemanha × Portugal</h2><p>Comparamos anúncios atuais de automóveis equivalentes. Só calculamos diferenças quando o custo total de importação está documentado.</p></div></div>
    <div className="market-controls"><label htmlFor="market-filter">Mostrar <select id="market-filter" value={filter} onChange={e=>setFilter(e.target.value as 'all'|'priced')}><option value="all">Todas as comparações verificadas</option><option value="priced">Apenas com custos completos e correspondência alta</option></select></label></div>
    {status==='loading'?<p role="status">A consultar fontes aprovadas…</p>:status==='error'?<div role="alert" className="intelligence-empty">O comparador não conseguiu consultar as fontes autorizadas. Nenhum preço foi presumido.</div>:!displayed.length?<div className="intelligence-empty"><strong>Sem comparações disponíveis.</strong><p>Precisamos de anúncios de ambos os países, versões suficientemente equivalentes e, para calcular a diferença, uma cotação de importação completa e verificada.</p></div>:<div className="market-pairs">{displayed.map(p=><article className="market-pair" key={p.german.id}>
      <div className="market-pair-head"><strong>{p.german.brand} {p.german.model}</strong><span className={'market-confidence '+p.confidence}>Correspondência {p.confidence==='high'?'alta':p.confidence==='medium'?'média':'baixa'}</span></div>
      <div className="market-pair-columns"><div><small>ALEMANHA · ANÚNCIO</small><strong>{euro(p.german.asking_price_eur!)}</strong><small>{p.german.year??'Ano por confirmar'} · {p.german.mileage_km?.toLocaleString('pt-PT')??'—'} km · {p.german.version??'Versão não informada'}</small><a href={p.german.source_url} target="_blank" rel="noopener noreferrer">Origem: {p.german.source_name} ↗</a></div><div><small>PORTUGAL · REFERÊNCIA</small><strong>{euro(p.portuguese.asking_price_eur!)}</strong><small>{p.portuguese.year??'Ano por confirmar'} · {p.portuguese.mileage_km?.toLocaleString('pt-PT')??'—'} km · {p.portuguese.version??'Versão não informada'}</small><a href={p.portuguese.source_url} target="_blank" rel="noopener noreferrer">Origem: {p.portuguese.source_name} ↗</a></div></div>
      <div className="market-result"><div><small>CUSTO TOTAL ESTIMADO EM PORTUGAL</small><strong>{p.landed_eur===null?'A aguardar cotação':euro(p.landed_eur)}</strong></div><div><small>DIFERENÇA ENTRE PREÇOS PEDIDOS</small><strong>{p.price_difference_eur===null?'Não calculável':(p.price_difference_eur>=0?'+':'')+euro(p.price_difference_eur)}</strong></div></div>
      <p className="market-caveat">{p.caveat}. {p.reasons.join(' · ')}. Verificado DE: {new Date(p.german.verified_at).toLocaleDateString('pt-PT')}; PT: {new Date(p.portuguese.verified_at).toLocaleDateString('pt-PT')}.</p>
    </article>)}</div>}
    <p className="intelligence-disclaimer">Não são ofertas de venda da German Circle. As fontes comerciais requerem autorização de uso. Equipamentos, estado de conservação, garantia e condições contratuais podem diferir mesmo entre versões semelhantes. Os preços são pedidos e podem mudar sem aviso. Não substitui proposta formal nem cálculo fiscal certificado.</p>
  </section>;
}
