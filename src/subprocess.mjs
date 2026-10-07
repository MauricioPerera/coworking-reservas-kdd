import { spawn } from 'node:child_process';

export function runChild(command, args, { cwd, env, timeoutMs, maxBytes = 2 * 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, shell: false, windowsHide: true,
      detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
    let failure, bytes = 0, stdout = '', stderr = '', escalation;
    const stop = () => {
      if (!child.pid) return;
      if (process.platform === 'win32') {
        const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
        killer.on('error', () => child.kill());
      } else {
        try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill(); }
        escalation = setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }, 500);
      }
    };
    const fail = (code, message) => { if (!failure) { failure = Object.assign(new Error(message), { code }); stop(); } };
    const timer = setTimeout(() => fail('E2E_PROCESS_TIMEOUT', 'Runner exceeded its timeout'), timeoutMs ?? 24000);
    for (const [stream, name] of [[child.stdout, 'stdout'], [child.stderr, 'stderr']]) {
      stream.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > maxBytes) return fail('E2E_PROCESS_OUTPUT_LIMIT', 'Runner output exceeded its limit');
        if (name === 'stdout') stdout += chunk.toString(); else stderr += chunk.toString();
      });
    }
    child.on('error', error => { clearTimeout(timer); clearTimeout(escalation); reject(error); });
    child.on('close', (exitCode, signal) => {
      clearTimeout(timer); clearTimeout(escalation);
      if (!failure && exitCode !== 0) failure = Object.assign(new Error(`Runner failed: exit=${exitCode}, signal=${signal}`), { code: 'E2E_PROCESS_FAILED' });
      if (failure) reject(Object.assign(failure, { stdout, stderr, exitCode }));
      else resolve({ exitCode, stdout, stderr });
    });
  });
}
