import {openSharedStore} from './shared-store.mjs';

const statuses={INVALID_TITLE:400,INVALID_ROOM:400,INVALID_DATE:400,INVALID_INTERVAL:400,
  CONFLICT:409,NOT_FOUND:404,ALREADY_CANCELLED:409,IDENTIFIERS_EXHAUSTED:503,
  CORRUPT_STORAGE:503,INVALID_STATE:503,STORAGE_UNAVAILABLE:503,
  INVALID_REQUEST:400,UNSUPPORTED_MEDIA:415,FORBIDDEN_ORIGIN:403,METHOD_NOT_ALLOWED:405};
function reject(code){throw Object.assign(new Error(code),{code});}
function send(response,status,body){response.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});response.end(JSON.stringify(body));}
async function json(request){
  if(request.headers['content-type']?.split(';')[0].trim().toLowerCase()!=='application/json')reject('UNSUPPORTED_MEDIA');
  if(request.headers.origin&&request.headers.origin!==`http://${request.headers.host}`)reject('FORBIDDEN_ORIGIN');
  let bytes=0;const chunks=[];
  for await(const chunk of request){bytes+=chunk.length;if(bytes>8192)reject('INVALID_REQUEST');chunks.push(chunk);}
  let value;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{reject('INVALID_REQUEST');}
  if(!value||typeof value!=='object'||Array.isArray(value))reject('INVALID_REQUEST');return value;
}
export function createSharedApi(file){
  let store;
  const storage=()=>store??=openSharedStore(file);
  return {
    async handle(request,response,pathname){
      try{
        const cancel=pathname.match(/^\/api\/bookings\/(r[1-9]\d*)\/cancel$/);
        if(pathname!=='/api/bookings'&&!cancel){send(response,404,{error:{code:'NOT_FOUND'}});return;}
        if(request.method==='GET'&&pathname==='/api/bookings'){send(response,200,storage().read());return;}
        if(request.method!=='POST')reject('METHOD_NOT_ALLOWED');
        const body=await json(request);
        const result=cancel?storage().cancel(cancel[1]):storage().reserve(body);
        send(response,cancel?200:201,result);
      }catch(error){
        const code=Object.hasOwn(statuses,error.code)?error.code:'STORAGE_UNAVAILABLE';
        send(response,statuses[code],{error:{code}});
      }
    },
    close(){store?.close();},
  };
}
