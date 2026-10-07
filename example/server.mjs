import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
const files = {
  '/': ['index.html', 'text/html'], '/todos': ['index.html', 'text/html'],
  '/client.mjs': ['client.mjs', 'text/javascript'], '/todo-model.mjs': ['todo-model.mjs', 'text/javascript'],
};
const server = createServer((request, response) => {
  let pathname;
  try { pathname = new URL(request.url, 'http://127.0.0.1').pathname; }
  catch { response.writeHead(400); response.end('Bad request'); return; }
  const route = files[pathname];
  if (!route) { response.writeHead(404); response.end('Not found'); return; }
  response.writeHead(200, { 'content-type': `${route[1]}; charset=utf-8`, 'cache-control': 'no-store' });
  response.end(readFileSync(new URL(route[0], import.meta.url)));
});
server.listen(Number(process.env.PORT ?? 4272), '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
