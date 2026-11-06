import 'server-only';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';

function config(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anon||!service||url.includes('YOUR_PROJECT')||service.includes('YOUR_'))return null;
  return {url,anon,service};
}
export async function adminFromRequest(request:Request):Promise<{id:string;db:SupabaseClient}|null>{
  const cfg=config();if(!cfg)return null;
  const header=request.headers.get('authorization')??'';
  const match=/^Bearer ([A-Za-z0-9._~-]+)$/.exec(header);
  if(!match)return null;
  const auth=createClient(cfg.url,cfg.anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userResult,error}=await auth.auth.getUser(match[1]);
  if(error||!userResult.user)return null;
  const db=createClient(cfg.url,cfg.service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:admin,error:adminError}=await db.from('ingestion_admins').select('user_id,enabled').eq('user_id',userResult.user.id).eq('enabled',true).maybeSingle();
  if(adminError||!admin)return null;
  return {id:userResult.user.id,db};
}
