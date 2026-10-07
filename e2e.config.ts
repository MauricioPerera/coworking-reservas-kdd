import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
export default {
  projectId: 'dev.kdd.coworking.reservas',
  tests: ['tests/*.e2e.ts'],
  retries: 0,
  workers: 1,
  cache: 'off',
  trace: 'on',
  targets: [{
    name: 'web', engine: web(),
    app: { url: 'http://127.0.0.1:0', command: { executable: process.execPath,
      args: ['example/server.mjs'], env: { PORT: '{port}' } } },
  }],
} satisfies E2EConfig;
