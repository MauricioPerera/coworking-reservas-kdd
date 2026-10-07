import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAcceptance } from '../src/oracle.mjs';
test('sealed KDD oracle verifies the seven expected browser cases', { timeout: 27000 }, async () => {
  const evidence = await runAcceptance();
  assert.equal(evidence.status, 'locally_verified');
  assert.equal(evidence.uiTests, 7);
  assert.equal(evidence.outerNodeTests, 1);
  assert.match(evidence.commit, /^[a-f0-9]{40}$/);
  assert.match(evidence.runId, /^[a-f0-9-]{36}$/);
});
