import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

export function gitExecutable() {
  const native = path.join(process.env.ProgramFiles ?? 'C:\\Program Files', 'Git', 'cmd', 'git.exe');
  return process.platform === 'win32' && existsSync(native) ? native : 'git';
}
export function git(root, args) {
  return execFileSync(gitExecutable(), ['-C', root, ...args], { encoding: 'utf8', windowsHide: true, timeout: 30000 }).trim();
}
export function gitEnvironment() {
  const env = { ...process.env };
  if (process.platform === 'win32') {
    const pathKeys = Object.keys(env).filter(key => key.toLowerCase() === 'path');
    const originalPath = env[pathKeys[0]] ?? '';
    for (const key of pathKeys) delete env[key];
    env.PATH = `${path.dirname(gitExecutable())};${originalPath}`;
  }
  return env;
}
