import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
const files = {
  '/': ['index.html', 'text/html'], '/reservas': ['index.html', 'text/html'],
  '/client.mjs': ['client.mjs', 'text/javascript'], '/booking-model.mjs': ['booking-model.mjs', 'text/javascript'],
  '/booking-storage.mjs': ['booking-storage.mjs', 'text/javascript'],
  '/compartidas': ['index.html','text/html'], '/shared-client.mjs': ['shared-client.mjs','text/javascript'],
};
let sharedApi;
const server = createServer(async (request, response) => {
  let pathname;
  try { pathname = new URL(request.url, 'http://127.0.0.1').pathname; }
  catch { response.writeHead(400); response.end('Bad request'); return; }
  if(pathname.startsWith('/api/bookings')){
    sharedApi??=import('./shared-api.mjs').then(module=>module.createSharedApi(process.env.SHARED_DB_PATH??path.resolve('.e2e/shared-data/bookings.sqlite')));
    try{await (await sharedApi).handle(request,response,pathname);}
    catch{response.writeHead(503,{'content-type':'application/json','cache-control':'no-store'});response.end(JSON.stringify({error:{code:'STORAGE_UNAVAILABLE'}}));}
    return;
  }
  const route = files[pathname];
  if (!route) { response.writeHead(404); response.end('Not found'); return; }
  response.writeHead(200, { 'content-type': `${route[1]}; charset=utf-8`, 'cache-control': 'no-store' });
  response.end(readFileSync(new URL(route[0], import.meta.url)));
});
server.listen(Number(process.env.PORT ?? 4272), '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close(async()=>{if(sharedApi){try{(await sharedApi).close();}catch{}}process.exit(0);});server.closeAllConnections();
});
