'use client';
import {useEffect, useMemo, useRef, useState, type FormEvent} from 'react';
import type {User} from '@supabase/supabase-js';
import {supabase} from '../lib/supabase';
import {DreamIntelligence} from '../components/DreamIntelligence';
import {MemberWatchlist} from '../components/MemberWatchlist';
import {WeeklyDreamBrief} from '../components/WeeklyDreamBrief';
import {DreamAlerts} from '../components/DreamAlerts';
import {ImportCostWorksheet} from '../components/ImportCostWorksheet';
import {MarketComparison} from '../components/MarketComparison';
import {MODEL_CATALOG} from '../lib/intelligence';
import {BRANDS, euro, validCar, type Brand, type GarageCar, type GarageKind, type Horizon, type NewCar, type Fuel} from '../lib/types';
const fresh=(kind:GarageKind):NewCar=>({brand:'Porsche',model:'',version:'',year_from:null,budget_eur:null,horizon:'explorar',notes:'',priority:1,year_to:null,max_mileage_km:null,fuel:'indiferente',kind});
const fuelLabels:Record<Fuel,string>={indiferente:'Sem preferência',gasolina:'Gasolina',diesel:'Diesel',hibrido:'Híbrido',eletrico:'Elétrico'};
const horizonLabels:Record<Horizon,string>={'explorar':'A explorar','0-6':'Até 6 meses','6-12':'6 a 12 meses','12+':'Mais de 12 meses'};
export default function Page(){
  const api=useMemo(()=>supabase(),[]);
  const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[email,setEmail]=useState(''),[sent,setSent]=useState(false);
  const modalRef=useRef<HTMLDivElement|null>(null);
  const [kind,setKind]=useState<GarageKind>('dream'),[cars,setCars]=useState<GarageCar[]>([]),[editing,setEditing]=useState<string|null>(null);
  const [watchReload,setWatchReload]=useState(0);
  const [form,setForm]=useState<NewCar|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const selected=cars.filter(c=>c.kind===kind).sort((a,b)=>a.priority-b.priority || a.created_at.localeCompare(b.created_at));
  useEffect(()=>{if(!form)return;const previous=document.activeElement as HTMLElement|null;const modal=modalRef.current;const focusables=()=>Array.from(modal?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')||[]);focusables()[0]?.focus();function onKey(e:KeyboardEvent){if(e.key==='Escape'){setForm(null);setEditing(null);}if(e.key==='Tab'){const items=focusables();if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}document.addEventListener('keydown',onKey);return()=>{document.removeEventListener('keydown',onKey);previous?.focus();};},[form!==null]);
  async function loadCars(uid:string){if(!api)return;const {data,error}=await api.from('garage_vehicles').select('*').eq('owner_id',uid).order('created_at',{ascending:false});if(error)setNotice('Não foi possível carregar a garagem.');else setCars((data||[]) as GarageCar[]);}
  useEffect(()=>{
    if(!api){setReady(true);return;}
    let active=true;
    api.auth.getUser().then(({data})=>{if(!active)return;setUser(data.user);setReady(true);if(data.user)void loadCars(data.user.id);});
    const {data:{subscription}}=api.auth.onAuthStateChange((_event,session)=>{
      if(!active)return;setUser(session?.user||null);if(session?.user)void loadCars(session.user.id);else setCars([]);
    });
    return ()=>{active=false;subscription.unsubscribe();};
  },[api]);
  async function sendMagic(e:FormEvent){e.preventDefault();if(!api)return;setBusy(true);setNotice('');const {error}=await api.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin}});setBusy(false);if(error)setNotice('Falha ao enviar acesso. Confirme o endereço e as definições de autenticação.');else setSent(true);}
  async function saveCar(e:FormEvent){e.preventDefault();if(!form||!api||!user)return;const error=validCar(form);if(error){setNotice(error);return;}
    if(!editing&&selected.length>=5){setNotice('Limite de cinco automóveis nesta garagem.');return;}
    setBusy(true);setNotice('');
    const fields={...form,owner_id:user.id};
    const result=editing?await api.from('garage_vehicles').update(fields).eq('id',editing).eq('owner_id',user.id):await api.from('garage_vehicles').insert(fields);
    setBusy(false);
    if(result.error){setNotice('Não foi possível guardar. Verifique os dados ou o limite da garagem.');return;}
    setForm(null);setEditing(null);await loadCars(user.id);
  }
  async function removeCar(id:string){if(!api||!user||!window.confirm('Remover este automóvel da garagem?'))return;setBusy(true);const {error}=await api.from('garage_vehicles').delete().eq('id',id).eq('owner_id',user.id);setBusy(false);if(error)setNotice('Não foi possível remover o automóvel.');else await loadCars(user.id);}
  function editCar(c:GarageCar){setEditing(c.id);setForm({kind:c.kind,brand:c.brand,model:c.model,version:c.version,year_from:c.year_from,budget_eur:c.budget_eur,horizon:c.horizon,notes:c.notes,priority:c.priority,year_to:c.year_to,max_mileage_km:c.max_mileage_km,fuel:c.fuel});}
  return <div className="shell">
    <aside className="sidebar"><div className="brand"><div className="monogram">GC</div><div className="flag"><span/><span/><span/></div><strong>GERMAN CIRCLE</strong><small>PRIVATE MOTOR CLUB</small></div><div className="rule"/><div className="menu-label">MEMBER'S SPACE</div>
      <nav aria-label="Garagens"><button className={kind==='dream'?'selected':''} onClick={()=>{setKind('dream');setForm(null);}}>◇ Dream Garage</button><button className={kind==='owned'?'selected':''} onClick={()=>{setKind('owned');setForm(null);}}>▱ My Garage</button></nav>
      <div className="sidebar-foot">● FOUNDING EDITION<br/><small>Private digital experience</small></div>
    </aside>
    <main className="main"><header className="top"><span>MEMBER'S SPACE / {kind==='dream'?'DREAM GARAGE':'MY GARAGE'}</span><span>EST. 2027</span></header><div className="content">
      <p className="eyebrow">GERMAN CIRCLE · THE MEMBER EXPERIENCE</p><h1>{kind==='dream'?<>My German<br/><em>Dream Garage</em></>:<>My German<br/><em>Garage</em></>}</h1><p className="subtitle">{kind==='dream'?'Cinco automóveis. Infinitas possibilidades. Comece a desenhar a garagem que deseja conquistar.':'Os automóveis que já fazem parte da sua história.'}</p>
      {!api?<section className="panel"><h2>Configuração necessária</h2><p>Esta é a base de produção. Configure Supabase e as variáveis de ambiente para ativar autenticação e armazenamento privado. O protótipo offline continua disponível no pacote anterior.</p><code>NEXT_PUBLIC_SUPABASE_URL</code><br/><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></section>:
      !ready?<p role="status">A carregar…</p>:!user?<section className="panel auth"><p className="eyebrow">PRIVATE ACCESS</p><h2>A sua garagem começa aqui.</h2><p>Introduza o seu email para receber um acesso privado. Não é necessária uma palavra-passe.</p><form onSubmit={sendMagic}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.pt"/></label><button className="primary" disabled={busy}>{busy?'A enviar…':'Enviar ligação de acesso'}</button></form>{sent&&<p role="status">Se o email puder receber mensagens, verifique a caixa de entrada e siga a ligação.</p>}</section>:
      <><div className="toolbar"><div className="member-info">MEMBRO · {user.email||'Conta privada'} <button className="text-btn" onClick={()=>void api.auth.signOut()}>Terminar sessão</button></div><button className="primary" onClick={()=>{setEditing(null);setForm(fresh(kind));}} disabled={selected.length>=5}>+ Adicionar {kind==='dream'?'sonho':'automóvel'}</button></div>
      <div className="stats"><div><strong>{selected.length} <span>/ 5</span></strong><small>VEÍCULOS NA GARAGEM</small></div><div><strong>{kind==='dream'?'O futuro':'O presente'}</strong><small>{kind==='dream'?'OS SEUS OBJETIVOS':'A SUA HISTÓRIA'}</small></div></div>
      <section className="car-grid" aria-label="Automóveis guardados">{selected.length?selected.map(c=><article className="car-card" key={c.id}><div className="art"><span>{c.brand.toUpperCase()}</span><span className="outline-car" aria-hidden="true">◇</span></div><div className="card-content"><div className="card-priority">{kind==='dream'?`SONHO ${c.priority} · ${fuelLabels[c.fuel]}`:'A MINHA GARAGEM'}</div><h3>{c.model}</h3><p>{c.version||'Versão por definir'}{c.year_from?' · '+c.year_from+(c.year_to?'–'+c.year_to:'+') :''}{c.max_mileage_km!==null?' · até '+c.max_mileage_km.toLocaleString('pt-PT')+' km':''}</p><div className="meta"><div><small>{kind==='dream'?'ORÇAMENTO INDICADO':'VALOR DE MERCADO'}</small><strong>{kind==='dream'?(c.budget_eur!==null?euro(c.budget_eur):'Por definir'):'Ainda não disponível'}</strong></div><div><small>HORIZONTE</small><strong>{horizonLabels[c.horizon]}</strong></div></div>{c.notes&&<p className="notes">{c.notes}</p>}<div className="card-actions"><button onClick={()=>editCar(c)}>Editar</button><button disabled={busy} onClick={()=>void removeCar(c.id)}>Remover</button></div></div></article>):<div className="empty"><div className="empty-icon">◇</div><h2>A sua garagem está à espera.</h2><p>Escolha o primeiro automóvel que deseja acompanhar.</p><button className="primary" onClick={()=>{setEditing(null);setForm(fresh(kind));}}>Adicionar primeiro automóvel</button></div>}</section>
      {kind==='dream' && <WeeklyDreamBrief dreams={selected}/>}
      {kind==='dream' && <DreamAlerts dreams={selected} ownerId={user.id}/>}
      {kind==='dream' && <DreamIntelligence dreams={selected} userId={user.id} onWatchChange={()=>setWatchReload(n=>n+1)}/>}
      {kind==='dream' && <MemberWatchlist key={watchReload} user={user}/>}{kind==='dream' && <MarketComparison/>}
      {kind==='dream' && <ImportCostWorksheet/>}
      <div className="disclaimer">Ainda não existe um fornecedor de preços integrado nem estimativas de importação. O módulo de oportunidades só mostra registos autorizados, aprovados e verificados; se não houver, permanece vazio. A garagem é privada por padrão.</div>
      </>}
      {notice&&<p className="notice" role="alert">{notice} <button onClick={()=>setNotice('')} aria-label="Fechar mensagem">×</button></p>}
      {form&&<div className="overlay"><div ref={modalRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><h2 id="modal-title">{editing?'Editar automóvel':'Adicionar automóvel'}</h2><button aria-label="Fechar" onClick={()=>{setForm(null);setEditing(null);}}>×</button></div><form onSubmit={saveCar}><div className="fields"><label>Marca<select value={form.brand} onChange={e=>setForm({...form,brand:e.target.value as Brand})}>{BRANDS.map(b=><option key={b}>{b}</option>)}</select></label><label>Modelo<input list="gc-model-catalog" maxLength={55} value={form.model} required onChange={e=>setForm({...form,model:e.target.value})} placeholder="Ex.: 911, X5, GLC, Q5"/><datalist id="gc-model-catalog">{MODEL_CATALOG[form.brand].map(m=><option key={m} value={m}/>)}</datalist></label><label>Versão<input maxLength={80} value={form.version||''} onChange={e=>setForm({...form,version:e.target.value})}/></label><label>Prioridade (1 = maior)<select value={form.priority} onChange={e=>setForm({...form,priority:Number(e.target.value)})}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></label><label>Motorização<select value={form.fuel} onChange={e=>setForm({...form,fuel:e.target.value as Fuel})}>{Object.entries(fuelLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Ano mínimo<input type="number" min="1960" max="2035" value={form.year_from??''} onChange={e=>setForm({...form,year_from:e.target.value?Number(e.target.value):null})}/></label><label>Ano máximo<input type="number" min="1960" max="2035" value={form.year_to??''} onChange={e=>setForm({...form,year_to:e.target.value?Number(e.target.value):null})}/></label><label>Quilometragem máxima (km)<input type="number" min="0" max="1000000" value={form.max_mileage_km??''} onChange={e=>setForm({...form,max_mileage_km:e.target.value?Number(e.target.value):null})}/></label><label>Orçamento (€)<input type="number" min="0" max="10000000" value={form.budget_eur??''} onChange={e=>setForm({...form,budget_eur:e.target.value?Number(e.target.value):null})}/></label><label>Prazo<select value={form.horizon} onChange={e=>setForm({...form,horizon:e.target.value as Horizon})}>{Object.entries(horizonLabels).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label><label className="wide">Notas<textarea maxLength={500} value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/></label></div><div className="modal-actions"><button type="button" onClick={()=>{setForm(null);setEditing(null);}}>Cancelar</button><button className="primary" disabled={busy} type="submit">{busy?'A guardar…':'Guardar na garagem'}</button></div></form></div></div>}
    </div><footer>GERMAN CIRCLE · PRIVATE MOTOR CLUB <span>Your Garage. Your Dreams. Your Circle.</span></footer></main>
  </div>;
}
