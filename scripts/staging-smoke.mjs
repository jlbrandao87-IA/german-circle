/** German Circle staging smoke — run only against infrastructure you operate. */
const baseArg=process.env.GC_STAGING_URL;
const base=baseArg ? new URL(baseArg) : null;
if(!base || !['http:','https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash || (base.hostname!=='localhost'&&base.hostname!=='127.0.0.1'&&base.protocol!=='https:')) {
  console.error('Defina GC_STAGING_URL com URL HTTPS do seu staging (HTTP somente localhost).');
  process.exit(2);
}
const timeout=Number(process.env.GC_SMOKE_TIMEOUT_MS||10000);
if(!Number.isSafeInteger(timeout)||timeout<1000||timeout>30000)throw Error('Tempo limite inválido.');
const target=p=>new URL(p,base);
const checks=[];
async function check(name,action){try {const result=await action();checks.push({name,ok:result.ok,detail:result.detail});}catch(e){checks.push({name,ok:false,detail:e instanceof Error?e.name:'error'});}}
const request=(path,options={})=>fetch(target(path),{...options,redirect:'manual',signal:AbortSignal.timeout(timeout)});
await check('Página principal responde',async()=>{const r=await request('/');return {ok:r.status===200&&String(r.headers.get('content-type')).includes('text/html'),detail:`HTTP ${r.status}`};});
await check('Ingestão não permite POST anónimo',async()=>{const r=await request('/api/admin/feed-import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({supplier_id:'demo',csv:'id,price\n1,20000'})});return {ok:r.status===401,detail:`HTTP ${r.status}`};});
await check('Ingestão não revela resultado a token inválido',async()=>{const r=await request('/api/admin/feed-import',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer invalid-test-token'},body:'{}'});return {ok:r.status===401,detail:`HTTP ${r.status}`};});
await check('Resposta administrativa não deve ser armazenada',async()=>{const r=await request('/api/admin/feed-import',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});return {ok:r.headers.get('cache-control')?.includes('no-store')===true,detail:r.headers.get('cache-control')||'ausente'};});
for(const c of checks)console.log(`${c.ok?'OK':'FALHOU'} — ${c.name}: ${c.detail}`);
if(checks.some(c=>!c.ok))process.exitCode=1;
