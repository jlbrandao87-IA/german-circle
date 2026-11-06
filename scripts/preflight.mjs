import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const checks=[];
function add(name,pass,detail){checks.push({name,pass,detail});}
add('Node >= 20.9',Number(process.versions.node.split('.')[0])>=20,process.versions.node);
add('Dependências instaladas',existsSync(resolve(root,'node_modules/next/package.json')),'npm ci necessário antes do build');
add('Migrações SQL',readdirSync(resolve(root,'supabase/migrations')).filter(n=>n.endsWith('.sql')).length>=8,'rever/aplicar em ordem em staging');
add('Segredos não estão no exemplo público',!readFileSync(resolve(root,'.env.example'),'utf8').includes('sk_live_'),'nunca publicar valores de service_role');
const raw=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
add('URL Supabase configurada',/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(raw),'configure no ambiente de staging');
add('Chave pública Supabase configurada',!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY&&!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('YOUR_'),'configure chave publishable/anon');
add('Chave do servidor configurada',!!process.env.SUPABASE_SERVICE_ROLE_KEY&&!process.env.SUPABASE_SERVICE_ROLE_KEY.includes('YOUR_'),'exclusivamente no servidor');
for(const c of checks)process.stdout.write(`${c.pass?'OK':'PENDENTE'} — ${c.name}: ${c.detail}\n`);
if(checks.some(c=>!c.pass)){process.stdout.write('Preflight incompleto; não publicar em produção.\n');process.exitCode=1;}
