'use client';
import {useEffect,useState} from 'react';
import {matchDream,type MarketListing,type Match,MODEL_CATALOG} from '../lib/intelligence';
import {euro,type GarageCar} from '../lib/types';
import {supabase} from '../lib/supabase';
import {WatchButton} from './MemberWatchlist';

type Props={dreams:GarageCar[]; userId:string; onWatchChange?:()=>void};
export function DreamIntelligence({dreams,userId,onWatchChange}:Props){
  const [listings,setListings]=useState<MarketListing[]>([]);
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  useEffect(()=>{
    const api=supabase();let active=true;
    if(!api){setStatus('error');return;}
    async function load(){
      const {data,error}=await api!.from('market_listings').select('id,brand,model,version,year,mileage_km,fuel,asking_price_eur,country,source_name,source_url,observed_at,verified_at,expires_at').eq('status','approved').gt('expires_at',new Date().toISOString()).order('verified_at',{ascending:false}).limit(250);
      if(!active)return;
      if(error){setStatus('error');return;}
      setListings((data||[]) as MarketListing[]);setStatus('ready');
    }
    void load();return()=>{active=false;};
  },[]);
  const matches=dreams.map(d=>({dream:d,result:matchDream(d,listings).slice(0,3)}));
  return <section className="intelligence-section" aria-labelledby="intelligence-title">
    <div className="intelligence-head"><div><p className="eyebrow">GERMAN INTELLIGENCE · EARLY ACCESS</p><h2 id="intelligence-title">O mercado dos seus sonhos</h2><p>Oportunidades verificadas e relacionadas com as preferências guardadas na sua Dream Garage.</p></div></div>
    {status==='loading'?<p role="status">A consultar oportunidades verificadas…</p>:status==='error'?<div className="intelligence-empty" role="alert">Não foi possível consultar o catálogo de oportunidades. Tente novamente mais tarde.</div>:!listings.length?<div className="intelligence-empty"><strong>A curadoria está a ser preparada.</strong><p>Ainda não há anúncios verificados e autorizados para apresentar. Não inventamos ofertas nem preços.</p></div>:!dreams.length?<div className="intelligence-empty">Adicione um automóvel à Dream Garage para ativar a pesquisa por preferências.</div>:<div className="intelligence-results">{matches.map(({dream,result})=><div key={dream.id} className="intelligence-group"><h3>{dream.brand} {dream.model} <span>· {result.length} correspondência(s)</span></h3>{!result.length?<p>Não existem oportunidades verificadas compatíveis neste momento.</p>:result.map(({listing,score,reasons}:Match)=><article className="intelligence-result" key={listing.id}><div><strong>{listing.brand} {listing.model} {listing.version||''}</strong><p>{listing.year??'Ano não informado'} · {listing.mileage_km!==null?listing.mileage_km.toLocaleString('pt-PT')+' km':'Quilometragem não informada'} · {listing.country==='DE'?'Alemanha':'Portugal'}</p><small>{reasons.join(' · ')} · Afinidade {score}/100</small><small>Origem: {listing.source_name} · verificado em {new Date(listing.verified_at).toLocaleDateString('pt-PT')}</small></div><div className="intelligence-result-action"><strong>{listing.asking_price_eur!==null?euro(listing.asking_price_eur):'Preço não informado'}</strong><small>Preço pedido, não preço de venda</small><a href={listing.source_url} target="_blank" rel="noopener noreferrer">Consultar origem ↗</a><WatchButton listingId={listing.id} userId={userId} onChanged={onWatchChange}/></div></article>)}</div>)}</div>}
    <div className="intelligence-disclaimer">Os preços anunciados podem mudar e não são avaliações nem ofertas vinculativas. Para veículos na Alemanha, não incluem ISV, transporte, matrícula, serviços ou outros custos de importação. Sem acesso autorizado a fontes, o módulo permanece sem resultados. Modelos de referência: {Object.values(MODEL_CATALOG).reduce((n,models)=>n+models.length,0)}.</div>
  </section>;
}
