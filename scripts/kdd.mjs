import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { git, gitEnvironment } from '../src/git.mjs';
export const root = fileURLToPath(new URL('../', import.meta.url));
export const tooling = JSON.parse(readFileSync(path.join(root, 'tooling.json'), 'utf8'));
export const runtime = path.join(root, '.kdd-runtime/KDD');
export function checkTooling() {
  if (git(runtime, ['rev-parse', 'HEAD']) !== tooling.kdd.commit || git(runtime, ['status', '--porcelain'])) throw new Error('KDD runtime must match its pinned commit and remain clean');
}
export function runKdd(script, args = []) {
  checkTooling();
  const result = spawnSync('python', [path.join(runtime, 'scripts', script), ...args], {
    cwd: root, env: gitEnvironment(), windowsHide: true, stdio: 'inherit', timeout: 180000,
  });
  checkTooling();
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${script} failed (exit ${result.status})`);
}
