import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { git } from '../src/git.mjs';
import { requireApprovedRef } from '../scripts/approval.mjs';
test('quality entry point rejects absent, symbolic and nonexistent approval references', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'kdd-approval-test-'));
  git(root, ['init']); writeFileSync(path.join(root, 'fixture.txt'), 'test');
  git(root, ['add', 'fixture.txt']);
  git(root, ['-c', 'user.name=KDD test', '-c', 'user.email=kdd-test@example.invalid', 'commit', '-m', 'Synthetic approval fixture']);
  for (const value of [undefined, '', 'HEAD', 'main', '0'.repeat(40)]) assert.throws(() => requireApprovedRef(root, { KDD_QUALITY_APPROVED_REF: value }));
  const fixtureCommit = git(root, ['rev-parse', 'HEAD']);
  assert.equal(requireApprovedRef(root, { KDD_QUALITY_APPROVED_REF: fixtureCommit }), fixtureCommit);
});
