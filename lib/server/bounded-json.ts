/** Read an untrusted request body with an enforced byte limit, even without Content-Length. */
export async function readBoundedJson(request:Request,maxBytes:number):Promise<unknown>{
  if(!Number.isSafeInteger(maxBytes)||maxBytes<1)throw new Error('invalid_limit');
  const declared=request.headers.get('content-length');
  if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>maxBytes))throw new Error('payload_too_large');
  if(!request.body)throw new Error('invalid_json');
  const reader=request.body.getReader();
  const parts:Uint8Array[]=[];
  let total=0;
  try{
    while(true){
      const {value,done}=await reader.read();
      if(done)break;
      total+=value.byteLength;
      if(total>maxBytes)throw new Error('payload_too_large');
      parts.push(value);
    }
  }catch(error){await reader.cancel().catch(()=>{});throw error;}
  finally{reader.releaseLock();}
  try{
    const decoder=new TextDecoder('utf-8',{fatal:true});
    let content='';
    for(let i=0;i<parts.length;i++)content+=decoder.decode(parts[i],{stream:i<parts.length-1});
    return JSON.parse(content);
  }catch{throw new Error('invalid_json');}
}
