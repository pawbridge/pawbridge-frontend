import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadEnv } from 'vite';
import { validateEnvironment } from './environment-policy.mjs';

const environment = process.argv[2];
// Read exactly the mode Vite will use, then pin checked values in the process env.
const env = validateEnvironment(environment, { ...process.env, ...loadEnv(environment, process.cwd(), 'VITE_') });
for (const [tool, args] of [['typescript/bin/tsc', ['-b']], ['vite/bin/vite.js', ['build', '--mode', environment, '--outDir', `dist/${environment}`]]]) {
  const executable = tool === 'typescript/bin/tsc' ? 'node_modules/typescript/bin/tsc' : 'node_modules/vite/bin/vite.js';
  const result = spawnSync(process.execPath, [executable, ...args], { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
mkdirSync(`dist/${environment}`, { recursive: true });
writeFileSync(`dist/${environment}/environment.json`, JSON.stringify({ environment, apiOrigin: env.VITE_API_BASE_URL, sourceRevision: process.env.GITHUB_SHA || null }));
if (environment === 'dev') {
  writeFileSync('dist/dev/robots.txt', 'User-agent: *\nDisallow: /\n');
  writeFileSync('dist/dev/_headers', '/*\n  X-Robots-Tag: noindex, nofollow\n');
}
