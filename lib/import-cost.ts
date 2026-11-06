/**
 * Portugal import planning worksheet. This does NOT calculate statutory tax rates.
 * All amounts (including ISV and potential VAT) must come from verified quotes or
 * professional assessment for this exact vehicle and transaction.
 * A missing amount is unknown, never silently zero.
 */
export type ExpenseKey = 'isv'|'vat'|'transport'|'inspection'|'registration'|'service'|'other';
export type CostInputs = {
  purchase_eur:number|null;
  expenses:Record<ExpenseKey,number|null>;
  comparison_pt_eur:number|null;
  comparison_source_url:string;
  comparison_verified_at:string;
};
export type CostEvaluation = {
  status:'incomplete'|'complete';
  missing:string[];
  partial_known_total_eur:number|null;
  landed_total_eur:number|null;
  comparison_delta_eur:number|null;
  comparison_status:'unavailable'|'unverified'|'comparable';
};
export const COST_LABELS:Record<ExpenseKey,string>={
  isv:'ISV confirmado para este veículo',
  vat:'IVA adicional aplicável (ou 0 validado)',
  transport:'Transporte e seguro logístico',
  inspection:'Inspeção e homologação',
  registration:'Matrícula e documentação',
  service:'Serviços e preparação',
  other:'Outras despesas (ou 0 validado)',
};
export const EXPENSE_KEYS=Object.keys(COST_LABELS) as ExpenseKey[];
export function blankCostInputs():CostInputs{
  return {purchase_eur:null,expenses:Object.fromEntries(EXPENSE_KEYS.map(k=>[k,null])) as Record<ExpenseKey,number|null>,comparison_pt_eur:null,comparison_source_url:'',comparison_verified_at:''};
}
export function validMoney(v:number|null):boolean {return v!==null&&Number.isFinite(v)&&v>=0&&v<=10000000&&Math.round(v*100)===v*100;}
export function evaluation(inputs:CostInputs,now=new Date()):CostEvaluation{
  const missing:string[]=[];
  if(!validMoney(inputs.purchase_eur)||inputs.purchase_eur===0)missing.push('Preço de aquisição confirmado');
  for(const key of EXPENSE_KEYS)if(!validMoney(inputs.expenses[key]))missing.push(COST_LABELS[key]);
  const known=[inputs.purchase_eur,...EXPENSE_KEYS.map(k=>inputs.expenses[k])].filter(validMoney) as number[];
  const partial=known.length?Math.round(known.reduce((a,b)=>a+b,0)*100)/100:null;
  const complete=missing.length===0;
  const total=complete?partial:null;
  let comparison_status:CostEvaluation['comparison_status']='unavailable';
  if(inputs.comparison_pt_eur!==null||inputs.comparison_source_url.trim()||inputs.comparison_verified_at.trim()){
    comparison_status='unverified';
    let goodSource=false;
    try{const url=new URL(inputs.comparison_source_url);goodSource=url.protocol==='https:'&&Boolean(url.hostname);}catch{}
    const verified=Date.parse(inputs.comparison_verified_at);
    if(validMoney(inputs.comparison_pt_eur)&&inputs.comparison_pt_eur!>0&&goodSource&&Number.isFinite(verified)&&verified<=now.getTime()&&now.getTime()-verified<=7*86400000)comparison_status='comparable';
  }
  return {status:complete?'complete':'incomplete',missing,partial_known_total_eur:partial,landed_total_eur:total,comparison_delta_eur:total!==null&&comparison_status==='comparable'?Math.round((inputs.comparison_pt_eur!-total)*100)/100:null,comparison_status};
}
