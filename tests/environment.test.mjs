import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { gitEnvironment } from '../src/git.mjs';
test('Git runtime environment preserves access to the required Python interpreter', () => {
  const env = gitEnvironment();
  const result = spawnSync('python', ['-c', 'import sys; print(sys.version_info.major)'], { env, encoding: 'utf8' });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '3');
  if (process.platform === 'win32') assert.equal(Object.keys(env).filter(key => key.toLowerCase() === 'path').length, 1);
});
