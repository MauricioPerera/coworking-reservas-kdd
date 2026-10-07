import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runChild } from '../src/subprocess.mjs';
test('returns actual successful process output', async () => {
  const result = await runChild(process.execPath, ['-e', 'console.log("actual")'], { timeoutMs: 2000 });
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /actual/);
});
test('rejects nonzero exits even when stdout claims PASS', async () => {
  await assert.rejects(runChild(process.execPath, ['-e', 'console.log("PASS");process.exit(1)'], { timeoutMs: 2000 }), { code: 'E2E_PROCESS_FAILED' });
});
test('rejects unavailable executables', async () => {
  await assert.rejects(runChild('kdd-executable-that-does-not-exist', [], { timeoutMs: 2000 }));
});
test('terminates and rejects a timed out process', async () => {
  await assert.rejects(runChild(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { timeoutMs: 100 }), { code: 'E2E_PROCESS_TIMEOUT' });
});
test('rejects a process exceeding the bounded output', async () => {
  await assert.rejects(runChild(process.execPath, ['-e', 'console.log("x".repeat(2048))'], { timeoutMs: 2000, maxBytes: 256 }), { code: 'E2E_PROCESS_OUTPUT_LIMIT' });
});
