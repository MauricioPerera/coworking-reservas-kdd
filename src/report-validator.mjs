import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
const schema = JSON.parse(readFileSync(new URL('../schema/report-v1.schema.json', import.meta.url), 'utf8'));
const conforms = ajv.compile(schema);
const identity = item => JSON.stringify([item.file, item.targetId, item.titlePath]);
function requireEvidence(condition, message) {
  if (!condition) throw Object.assign(new Error(message), { code: 'E2E_EVIDENCE_INVALID' });
}
function isDeterministicStep(step) {
  return step.status === 'passed' && !step.error &&
    (step.metrics?.modelCalls ?? 0) === 0 && (step.model?.calls ?? 0) === 0 &&
    step.events.every(event => event.kind !== 'model' &&
      (event.inputTokens ?? 0) === 0 && (event.outputTokens ?? 0) === 0);
}

export function validateReport(report, expected) {
  requireEvidence(conforms(report), `Invalid report-1: ${ajv.errorsText(conforms.errors)}`);
  const { manifest, startedAt, finishedAt, commit } = expected;
  const cases = manifest.expectedCases;
  requireEvidence(Array.isArray(cases) && cases.length > 0, 'Expected cases must be nonempty');
  requireEvidence(cases.every(item => typeof item.file === 'string' && typeof item.targetId === 'string' &&
    Array.isArray(item.titlePath) && item.titlePath.length > 0 && item.titlePath.every(title => typeof title === 'string' && title.length)), 'Invalid expected case');
  const expectedKeys = cases.map(identity).sort();
  requireEvidence(new Set(expectedKeys).size === cases.length, 'Duplicate expected case');
  const run = report.run;
  requireEvidence(run.runner.name === 'e2e' && run.runner.version === '0.17.0', 'Unexpected runner/version');
  requireEvidence(run.project.id === manifest.projectId, 'Unexpected project');
  requireEvidence(run.status === 'passed' && run.exitCode === 0 && run.errors.length === 0, 'Run did not pass');
  requireEvidence(run.vcs?.commit === commit && run.vcs?.dirty === false, 'Revision is missing, different or dirty');
  const start = Date.parse(run.startedAt), finish = Date.parse(run.finishedAt);
  requireEvidence(Number.isFinite(start) && Number.isFinite(finish) && start >= startedAt && finish >= start && finish <= finishedAt, 'Report is stale, unfinished or from the future');
  requireEvidence(run.serialGroups.length === 0 && !run.carried && !run.explore, 'Unsupported serial, carried or exploratory report');
  requireEvidence(run.results.every(item => typeof item.selected === 'boolean' && item.kind === 'test'), 'Unclassified result or unsupported setup');
  requireEvidence(run.results.filter(item => !item.selected).every(item =>
    item.status === 'skipped' && item.skip?.cause === 'filtered' &&
    item.attempts.length === 0 && !item.serialGroupId), 'Unselected cases must be filtered without execution');
  const selected = run.results.filter(item => item.selected);
  requireEvidence(JSON.stringify(selected.map(identity).sort()) === JSON.stringify(expectedKeys), 'Selected cases differ from the reviewed set');
  requireEvidence(new Set(run.results.map(item => item.id)).size === run.results.length, 'Duplicate result identity');
  for (const item of selected) {
    requireEvidence(item.platform === 'web' && item.agent === 'default' && item.repeat === 0 && item.status === 'passed' && !item.serialGroupId, 'Unexpected execution profile or case outcome');
    requireEvidence(item.attempts.length === 1, 'Retries are not accepted');
    const attempt = item.attempts[0];
    requireEvidence(attempt.index === 0 && attempt.status === 'passed' && attempt.cleanup === 'complete' && attempt.secondaryErrors.length === 0 && !attempt.error, 'Failed attempt or cleanup');
    const attemptStart = Date.parse(attempt.startedAt);
    requireEvidence(attemptStart >= start && attemptStart + attempt.durationMs <= finish + 2, 'Attempt is outside the current run');
    requireEvidence(attempt.steps.every(isDeterministicStep), 'Failed step or model use');
  }
  const summary = run.summary;
  requireEvidence(summary.selected === cases.length && summary.executed === cases.length && summary.passed === cases.length &&
    ['failed', 'interrupted', 'flaky', 'skipped'].every(name => summary[name] === 0), 'Inconsistent selected summary');
  requireEvidence(summary.discovered === run.results.length, 'Inconsistent discovery count');
  requireEvidence(run.usage.modelTokens === 0 && run.usage.maxModelCallsInStep === 0, 'Model use is outside the deterministic profile');
  return { runId: run.id, commit, uiTests: selected.length, configDigest: run.project.configDigest };
}
