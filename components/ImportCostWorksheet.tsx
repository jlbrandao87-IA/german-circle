'use client';
import {useMemo,useState} from 'react';
import {blankCostInputs,COST_LABELS,EXPENSE_KEYS,evaluation,type CostInputs} from '../lib/import-cost';
import {euro} from '../lib/types';

function readAmount(raw:string):number|null{
  if(raw.trim()==='')return null;
  const n=Number(raw);
  return Number.isFinite(n)&&n>=0?n:null;
}
export function ImportCostWorksheet(){
  const [values,setValues]=useState<CostInputs>(blankCostInputs);
  const result=useMemo(()=>evaluation(values),[values]);
  const changeExpense=(key:keyof CostInputs['expenses'],raw:string)=>setValues(v=>({...v,expenses:{...v.expenses,[key]:readAmount(raw)}}));
  return <section className="cost-workshop" aria-labelledby="cost-title">
    <div className="intelligence-head"><p className="eyebrow">DREAM INTELLIGENCE · SIMULADOR RESPONSÁVEL</p><h2 id="cost-title">O custo real, sem adivinhações.</h2><p>Preencha valores apurados para um veículo específico. Esta ferramenta soma custos; não calcula ISV ou IVA automaticamente.</p></div>
    <div className="cost-grid">
      <div className="cost-inputs">
        <label>Preço de compra na Alemanha (€)<input type="number" min="0" step="0.01" value={values.purchase_eur??''} placeholder="Valor confirmado" onChange={e=>setValues(v=>({...v,purchase_eur:readAmount(e.target.value)}))}/></label>
        {EXPENSE_KEYS.map(k=><label key={k}>{COST_LABELS[k]} (€)<input type="number" min="0" step="0.01" value={values.expenses[k]??''} placeholder="Por verificar" onChange={e=>changeExpense(k,e.target.value)}/></label>)}
      </div>
      <div className="cost-summary" aria-live="polite">
        <p className="eyebrow">RESUMO DA OPERAÇÃO</p>
        <small>Subtotal dos valores informados — não representa custo final</small>
        <strong>{result.partial_known_total_eur===null?'—':euro(result.partial_known_total_eur)}</strong>
        <hr/>
        <small>Custo total da importação</small>
        <strong>{result.landed_total_eur===null?'Por calcular':euro(result.landed_total_eur)}</strong>
        {result.status==='incomplete'?<p role="status">Faltam {result.missing.length} campos confirmados. Um custo desconhecido nunca é considerado zero.</p>:<p role="status">Todos os custos foram preenchidos pelo utilizador; confirme a documentação antes de uma decisão.</p>}
      </div>
    </div>
    <div className="cost-comparison">
      <h3>Comparar com uma oferta portuguesa equivalente</h3>
      <p>Use o mesmo modelo, versão, ano aproximado, quilometragem e equipamento. A comparação é apenas indicativa e utiliza preços pedidos.</p>
      <div className="cost-grid cost-compare-fields">
        <label>Preço anunciado em Portugal (€)<input type="number" min="0" step="0.01" value={values.comparison_pt_eur??''} placeholder="Preço pedido" onChange={e=>setValues(v=>({...v,comparison_pt_eur:readAmount(e.target.value)}))}/></label>
        <label>Link da fonte (HTTPS)<input type="url" value={values.comparison_source_url} placeholder="https://..." onChange={e=>setValues(v=>({...v,comparison_source_url:e.target.value}))}/></label>
        <label>Data de verificação<input type="date" value={values.comparison_verified_at.slice(0,10)} onChange={e=>setValues(v=>({...v,comparison_verified_at:e.target.value?`${e.target.value}T00:00:00Z`:''}))}/></label>
      </div>
      <div className="cost-summary cost-result" aria-live="polite"><small>Diferença indicativa Portugal − importação</small><strong>{result.comparison_delta_eur===null?'Sem comparação validada':euro(result.comparison_delta_eur)}</strong><p>{result.comparison_delta_eur===null?'Exige custo final completo e comparável português com fonte e verificação recente.':result.comparison_delta_eur>=0?'O preço pedido em Portugal é superior ao custo introduzido de importação. Não é uma poupança garantida.':'O custo introduzido de importação supera o preço pedido em Portugal.'}</p></div>
    </div>
    <button type="button" className="cost-reset" onClick={()=>setValues(blankCostInputs())}>Limpar simulação</button>
    <p className="intelligence-disclaimer">Ferramenta de planeamento. Não calcula impostos, não valida documentação, não cria cotação vinculativa e não certifica equivalência entre veículos. O regime de IVA depende da operação; 0 só deve ser indicado após confirmação. Os dados introduzidos não são guardados.</p>
  </section>;
}
