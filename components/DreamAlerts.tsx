'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';
import {collectDreamAlerts,DEFAULT_ALERT_SETTINGS,formatAlertDigest,validAlertSettings,type AlertSettings,type AlertFrequency} from '../lib/dream-alerts';
import type {GarageCar} from '../lib/types';
import type {MarketListing} from '../lib/intelligence';
import type {PriceObservation} from '../lib/watchlist';
import {euro} from '../lib/types';

type Props={dreams:GarageCar[];ownerId:string};
export function DreamAlerts({dreams,ownerId}:Props){
  const api=useMemo(()=>supabase(),[]);
  const [settings,setSettings]=useState<AlertSettings>(DEFAULT_ALERT_SETTINGS);
  const [listings,setListings]=useState<MarketListing[]>([]),[history,setHistory]=useState<PriceObservation[]>([]);
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [saveStatus,setSaveStatus]=useState('');
  const [partial,setPartial]=useState(false);
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    if(!api)return;
    let active=true;
    const load=async()=>{
      const [pref,l,h]=await Promise.all([
        api.from('member_alert_preferences').select('frequency,min_drop_pct,include_new_matches,include_price_drops').eq('owner_id',ownerId).maybeSingle(),
        api.from('market_listings').select('id,brand,model,version,year,mileage_km,fuel,asking_price_eur,country,source_name,source_url,observed_at,verified_at,expires_at').eq('status','approved').gt('expires_at',new Date().toISOString()).order('verified_at',{ascending:false}).limit(250),
        api.from('market_price_observations').select('listing_id,price_eur,observed_at').order('observed_at',{ascending:false}).limit(1000)
      ]);
      if(!active)return;
      if(pref.error||l.error||h.error){setStatus('error');return;}
      if(pref.data){const candidate={frequency:pref.data.frequency,min_drop_pct:Number(pref.data.min_drop_pct),include_new_matches:pref.data.include_new_matches,include_price_drops:pref.data.include_price_drops} as AlertSettings;if(validAlertSettings(candidate))setSettings(candidate);}
      setListings((l.data||[]) as MarketListing[]);
      setHistory((h.data||[]).map(o=>({listing_id:o.listing_id,price_eur:Number(o.price_eur),observed_at:o.observed_at})));
      setPartial((l.data||[]).length===250||(h.data||[]).length===1000);
      setStatus('ready');
    };
    void load();return()=>{active=false;};
  },[api,ownerId]);
  const alerts=collectDreamAlerts(dreams,listings,history,settings);
  async function save(){if(!api||!validAlertSettings(settings))return;setBusy(true);setSaveStatus('');const {error}=await api.from('member_alert_preferences').upsert({owner_id:ownerId,...settings,updated_at:new Date().toISOString()},{onConflict:'owner_id'});setBusy(false);setSaveStatus(error?'Não foi possível guardar as preferências.':'Preferências guardadas. O envio automático não está ativado.');}
  function exportDigest(){const content=formatAlertDigest(alerts,settings);const blob=new Blob([content],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='german-circle-dream-alerts.txt';document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);}
  return <section className="intelligence-section dream-alerts" aria-labelledby="dream-alerts-heading">
    <div className="intelligence-head"><p className="eyebrow">GERMAN INTELLIGENCE · PRIVATE ALERTS</p><h2 id="dream-alerts-heading">Os seus alertas</h2><p>Personalize o que deseja acompanhar nos automóveis da sua Dream Garage. Este painel é privado e não envia emails.</p></div>
    {status==='loading'?<p role="status">A preparar os alertas…</p>:status==='error'?<p role="alert">Não foi possível consultar as preferências ou as fontes. Confirme a migração v1.0 e a ligação ao banco.</p>:<>
      <div className="alerts-settings">
        <label>Frequência do resumo<select value={settings.frequency} onChange={e=>setSettings({...settings,frequency:e.target.value as AlertFrequency})}><option value="off">Desativado</option><option value="weekly">Semanal</option><option value="daily">Diário</option></select></label>
        <label>Queda mínima do preço<select value={settings.min_drop_pct} onChange={e=>setSettings({...settings,min_drop_pct:Number(e.target.value)})}>{[1,2,3,5,10,15,20].map(n=><option key={n} value={n}>{n}%</option>)}</select></label>
        <label className="alert-check"><input type="checkbox" checked={settings.include_new_matches} onChange={e=>setSettings({...settings,include_new_matches:e.target.checked})}/> Novos anúncios compatíveis</label>
        <label className="alert-check"><input type="checkbox" checked={settings.include_price_drops} onChange={e=>setSettings({...settings,include_price_drops:e.target.checked})}/> Reduções de preço documentadas</label>
      </div>
      <div className="alert-toolbar"><button type="button" className="primary" disabled={busy} onClick={()=>void save()}>{busy?'A guardar…':'Guardar preferências'}</button><button type="button" onClick={exportDigest}>Exportar resumo</button></div>
      {saveStatus&&<p role="status">{saveStatus}</p>}
      <div className="weekly-brief-stat"><div><strong>{alerts.length}</strong><small>Alertas nesta amostra*</small></div><div><strong>{dreams.length}</strong><small>Sonhos monitorizados</small></div></div>
      {!dreams.length?<div className="intelligence-empty">Adicione um automóvel à Dream Garage para começar.</div>:alerts.length?<div className="alert-list">{alerts.slice(0,15).map(a=><article className="alert-row" key={a.key}><div><strong>{a.dream_name}</strong><p>{a.kind==='new_match'?'Novo anúncio observado':`Redução de ${Math.abs(a.change_pct||0).toFixed(1)}%`} · {a.country==='DE'?'Alemanha':'Portugal'} · {a.source_name}</p></div><div><strong>{euro(a.price_eur)}</strong><a href={a.source_url} target="_blank" rel="noopener noreferrer">Ver fonte ↗</a></div></article>)}</div>:<div className="intelligence-empty">Nenhuma alteração identificada na amostra disponível para o período selecionado. Isso não significa que não existam oportunidades no mercado.</div>}
      {partial&&<p className="weekly-brief-warning" role="status">Cobertura parcial: o limite de registos consultados foi atingido.</p>}
      <p className="intelligence-disclaimer">* Pré-visualização, não notificações enviadas. A frequência define o período de consulta; não agenda envios automáticos. Os preços são valores pedidos por vendedores, não preços finais em Portugal. Ainda não há fornecedores externos conectados por padrão.</p>
    </>}
  </section>;
}
