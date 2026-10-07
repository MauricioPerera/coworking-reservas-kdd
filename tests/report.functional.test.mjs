import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateReport } from '../src/report-validator.mjs';
import { fixture } from './support/fixtures.mjs';

test('recognizes all seven expected cases and returns their run evidence', () => {
  const { report, expected } = fixture();
  const result = validateReport(report, expected);
  assert.equal(result.uiTests, 7);
  assert.equal(result.runId, report.run.id);
  assert.equal(result.commit, expected.commit);
});
test('allows legitimately discovered but unselected cases', () => {
  const { report, expected } = fixture();
  const excluded = structuredClone(report.run.results[0]);
  excluded.id = 'b'.repeat(64);
  excluded.testId = 'tests/other.e2e.ts::unselected';
  excluded.file = 'tests/other.e2e.ts';
  excluded.titlePath = ['unselected'];
  excluded.selected = false;
  excluded.status = 'skipped';
  excluded.skip = { cause: 'filtered', reason: 'not selected by file filter' };
  excluded.attempts = [];
  report.run.results.push(excluded);
  report.run.summary.discovered += 1;
  report.run.usage.discoveredResults += 1;
  assert.equal(validateReport(report, expected).uiTests, 7);
});
