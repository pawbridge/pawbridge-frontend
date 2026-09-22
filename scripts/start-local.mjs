import { spawn } from 'node:child_process';
import { loadEnv } from 'vite';
import { validateEnvironment } from './environment-policy.mjs';
const values = { VITE_API_BASE_URL: 'http://localhost:28080', ...loadEnv('dev', process.cwd(), 'VITE_'), ...process.env };
const env = { ...process.env, ...validateEnvironment('dev', values) };
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--mode', 'dev', '--host', '127.0.0.1', '--port', '5184', '--strictPort'], { env, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
