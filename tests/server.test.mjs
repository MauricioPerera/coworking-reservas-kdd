import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
import { setTimeout } from 'node:timers/promises';

test('malformed URLs return 400 and leave the fixture server available', { timeout: 15000 }, async t => {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const child = spawn(process.execPath, [fileURLToPath(new URL('../example/server.mjs', import.meta.url))], {
    env: { ...process.env, PORT: String(port) }, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'],
  });
  const closed = once(child, 'close');
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  t.after(async () => {
    if (child.exitCode === null) child.kill();
    await closed;
  });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    assert.equal(child.exitCode, null, stderr);
    try {
      const response = await fetch(base + '/reservas', { signal: AbortSignal.timeout(100) });
      ready = response.status === 200;
      await response.text();
      if (ready) break;
    } catch {}
    await setTimeout(50);
  }
  assert.equal(ready, true, `Fixture did not become available: ${stderr}`);
  for (const route of ['//invalid:port/', '//[bad/', '//:80/']) {
    const invalid = await fetch(base + route, { signal: AbortSignal.timeout(2000) });
    assert.equal(invalid.status, 400, route);
    assert.equal(await invalid.text(), 'Bad request');
    const healthy = await fetch(base + '/reservas', { signal: AbortSignal.timeout(2000) });
    assert.equal(healthy.status, 200);
    assert.match(await healthy.text(), /Reservas de salas/);
    assert.equal(child.exitCode, null, stderr);
  }
  const missing = await fetch(base + '/missing', { signal: AbortSignal.timeout(2000) });
  assert.equal(missing.status, 404);
  await missing.text();
});
