import { existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { root, runtime, tooling, checkTooling } from './kdd.mjs';
import { gitExecutable } from '../src/git.mjs';
if (!/^[a-f0-9]{40}$/.test(tooling.kdd.commit)) throw new Error('KDD must be pinned by full SHA');
if (!existsSync(runtime)) {
  mkdirSync(path.dirname(runtime), { recursive: true });
  const options = ['-c', 'core.autocrlf=false'];
  if (process.platform === 'win32') options.push('-c', 'http.sslBackend=schannel', '-c', 'http.sslCAInfo=');
  execFileSync(gitExecutable(), [...options, 'clone', '--no-checkout', tooling.kdd.repository, runtime], { cwd: root, windowsHide: true, stdio: 'inherit' });
  execFileSync(gitExecutable(), ['-C', runtime, '-c', 'core.autocrlf=false', 'checkout', '--detach', tooling.kdd.commit], { windowsHide: true, stdio: 'inherit' });
}
checkTooling();
console.log(`KDD ready at ${tooling.kdd.commit}`);
