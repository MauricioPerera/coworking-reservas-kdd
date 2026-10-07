import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { root, runtime, checkTooling } from './kdd.mjs';
import { gitEnvironment } from '../src/git.mjs';
checkTooling();
process.env.PATH = gitEnvironment().PATH;
const { runTaskTests, evidenceCurrent } = await import(pathToFileURL(path.join(runtime, 'tools/kdd-board/src/task-execution.ts')).href);
const task = { id: 'acceptance-probe', contractId: 'app-booking-ui.md' };
const store = {
  getTask: () => task,
  setTestCommand: (_id, command) => { task.testCommand = command; },
  recordTestReport: (_id, report) => { task.testReport = report; return task; },
};
const { report } = await runTaskTests(store, { environment: () => ({}) }, root, task.id);
checkTooling();
mkdirSync(path.join(root, '.e2e'), { recursive: true });
writeFileSync(path.join(root, '.e2e/board-probe.json'), JSON.stringify(report, null, 2) + '\n');
assert.equal(report.success, true, report.output);
assert.equal(report.verifiedOracle, true);
assert.equal(report.passedTests, 1);
assert.equal(evidenceCurrent(task), true);
console.log('PASS KDD Board executor: validated contract, sealed oracle, current hashes, one outer test');
