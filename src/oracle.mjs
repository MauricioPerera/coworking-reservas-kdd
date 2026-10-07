import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, realpathSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { git, gitEnvironment } from './git.mjs';
import { runChild } from './subprocess.mjs';
import { validateReport } from './report-validator.mjs';

const defaultRoot = fileURLToPath(new URL('../', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function projectFile(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || relative.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Invalid project-relative path');
  const file = path.resolve(root, relative);
  const rel = path.relative(root, realpathSync(file));
  if (path.isAbsolute(rel) || rel.startsWith('..') || lstatSync(file).isSymbolicLink()) throw new Error('Input escapes the project');
  return file;
}
function inputDigests(root, files) {
  return Object.fromEntries(files.map(file => [file, hash(readFileSync(projectFile(root, file)))]));
}
function runnerEnvironment() {
  const source = gitEnvironment(), env = {};
  for (const key of ['PATH', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA', 'LANG', 'LC_ALL', 'PLAYWRIGHT_BROWSERS_PATH']) {
    if (source[key] !== undefined) env[key] = source[key];
  }
  return { ...env, CI: '1', E2E_TELEMETRY_DISABLED: '1', FORCE_COLOR: '0' };
}
export async function runAcceptance({ root = defaultRoot } = {}) {
  root = realpathSync(root);
  if (realpathSync(git(root, ['rev-parse', '--show-toplevel'])) !== root) throw new Error('Project must be its Git repository root');
  const commit = git(root, ['rev-parse', 'HEAD']);
  if (git(root, ['status', '--porcelain', '--untracked-files=no'])) throw new Error('Commit tracked changes before collecting acceptance evidence');
  const manifest = JSON.parse(readFileSync(path.join(root, 'acceptance.json'), 'utf8'));
  if (manifest.schemaVersion !== 'kdd-e2e-acceptance-1' || !Number.isInteger(manifest.timeoutMs) || manifest.timeoutMs < 1000 || manifest.timeoutMs > 24000 || !Array.isArray(manifest.testFiles) || !manifest.testFiles.length) throw new Error('Invalid acceptance manifest');
  for (const file of manifest.testFiles) projectFile(root, file);
  const before = inputDigests(root, manifest.inputFiles);
  const id = randomUUID(), relativeOutput = `.e2e/runs/${id}/e2e`;
  const directory = path.join(root, '.e2e/runs', id);
  mkdirSync(directory, { recursive: true });
  const args = ['node_modules/e2e/dist/cli/bin.js', 'run', ...manifest.testFiles,
    '--config', 'e2e.config.ts', '--workers', '1', '--retries', '0', '--no-cache', '--output', relativeOutput];
  const startedAt = Date.now();
  let child;
  const context = { schemaVersion: 'kdd-e2e-evidence-1', contract: manifest.contract, commit,
    projectRoot: root, command: [process.execPath, ...args], inputDigests: before,
    outerNodeTests: 1, startedAt: new Date(startedAt).toISOString(),
    ci: process.env.GITHUB_RUN_ID ? { repository: process.env.GITHUB_REPOSITORY,
      runId: process.env.GITHUB_RUN_ID, headSha: process.env.GITHUB_SHA,
      runUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` } : null };
  try {
    child = await runChild(process.execPath, args, { cwd: root, env: runnerEnvironment(), timeoutMs: manifest.timeoutMs });
    const reportPath = path.join(directory, 'e2e/report.json');
    const bytes = readFileSync(reportPath);
    if (bytes.length > 4 * 1024 * 1024) throw new Error('Report exceeded its size limit');
    const result = validateReport(JSON.parse(bytes.toString()), { manifest, commit, startedAt, finishedAt: Date.now() });
    if (JSON.stringify(before) !== JSON.stringify(inputDigests(root, manifest.inputFiles))) throw new Error('Inputs changed during acceptance');
    const evidence = { ...context, ...result, status: 'locally_verified', reportPath: `${relativeOutput}/report.json`, reportSha256: hash(bytes), finishedAt: new Date().toISOString() };
    writeFileSync(path.join(directory, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
    writeFileSync(path.join(directory, 'runner.log'), child.stdout + child.stderr);
    return evidence;
  } catch (error) {
    writeFileSync(path.join(directory, 'evidence.json'), JSON.stringify({ ...context, status: 'failed', error: { code: error.code ?? 'E2E_ACCEPTANCE_FAILED', message: error.message }, finishedAt: new Date().toISOString() }, null, 2) + '\n');
    writeFileSync(path.join(directory, 'runner.log'), (child?.stdout ?? error.stdout ?? '') + (child?.stderr ?? error.stderr ?? ''));
    throw error;
  }
}
