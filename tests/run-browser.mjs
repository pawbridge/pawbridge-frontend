// Shared runner for the mock browser tests listed in tests/browser-manifest.json.
//
//   node tests/run-browser.mjs                 run every mock test
//   node tests/run-browser.mjs name1 name2     run the selected tests
//   node tests/run-browser.mjs --repeat 3 name run the selection three times
//
// Network guarantee: Chromium resolves only localhost and 127.0.0.1, the Google font hosts the
// production page loads (so screenshots look like production) and a test's allowHosts, so browser
// requests to other hosts cannot leave the machine. Requests made on the Node side
// (route.fetch, page.request) are not covered by this guard.
import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repoRoot, 'tests', 'browser-manifest.json');
const buildRoot = path.join(repoRoot, '.browser-test-build');
const logDirectory = path.join(buildRoot, 'logs');
const resultDirectory = path.join(buildRoot, 'results');
const failureDirectory = path.join(buildRoot, 'failures');
const viteBin = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const viteMode = 'browser-test';

const viewport = { width: 1440, height: 1000 };
const defaultTimeoutMs = 15_000;
const hardTimeoutMs = 5 * 60_000;
const serverStartTimeoutMs = 60_000;
const warmUpTimeoutMs = 90_000;

// Mock API addresses the tests intercept, and the vite.config.ts proxy targets that same-origin builds forward
// unmocked /api calls to from Node; a real listener on any of them could receive unmocked calls.
const reservedApiPorts = [28080, 28089, 8080, 8084, 8085];
const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
const featureFlags = ['VITE_MEMBER_CHAT_ENABLED', 'VITE_DAILY_VISITORS_ENABLED', 'VITE_VISITOR_TEST_MODE'];
const reloadLogPattern = /optimized dependencies changed|page reload/i;
const callKinds = new Set(['page', 'page-origin', 'page-fixture', 'browser-fixture', 'page-origin-evidence-phase']);

const startedServers = [];
const launchedBrowsers = [];
const reloadEvents = [];
const lateRejections = [];
let currentTestLabel = 'startup';
// Rejections raised while a test runs (assertions thrown inside route handlers end up here) fail that test.
let activeTestRejections = null;
const rejectionGraceMs = 500;
// External resources the app itself loads (fonts, address search script, login and site images). Requests to them
// are aborted quietly; an aborted request to any other host fails the test, so a new external dependency or a call
// to a real API host (for example api.pawbridge.kr) is caught.
// Fonts the production page loads from Google (index.html): Noto Sans KR and the Material Symbols
// icon font. Without them icons render as their names ("menu", "person") and screenshots differ
// from production. These hosts serve static font files only, so no API call can leave through them.
const productionFontHosts = ['fonts.googleapis.com', 'fonts.gstatic.com'];

function allowedHostsFor(test) {
  return [...new Set([...productionFontHosts, ...(test.allowHosts || [])])];
}

const knownAppHosts = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  't1.daumcdn.net',
  'lh3.googleusercontent.com',
  'www.pawbridge.kr',
]);
let cleanupPromise = null;
let interruptedBy = null;

class RunnerAbort extends Error {}

function abort(message) {
  throw new RunnerAbort(message);
}

function parseArguments(argv) {
  const names = [];
  let repeat = 1;
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === '--repeat') {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value < 1) {
        abort('--repeat needs a positive integer');
      }
      repeat = value;
      index++;
      continue;
    }
    if (argument.startsWith('--')) {
      abort(`Unknown option ${argument}`);
    }
    names.push(argument.replace(/\.browser\.js$/, ''));
  }
  return { names, repeat };
}

function loadManifest() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const seenNames = new Set();
  for (const test of manifest.tests) {
    if (seenNames.has(test.name)) {
      abort(`Duplicate manifest entry ${test.name}`);
    }
    seenNames.add(test.name);
    if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(test.origin)) {
      abort(`${test.name}: origin must be http://127.0.0.1:<port> or http://localhost:<port>`);
    }
    if (!['dev', 'preview'].includes(test.server)) {
      abort(`${test.name}: server must be dev or preview`);
    }
    if (test.group !== 'mock') {
      abort(`${test.name}: group must be mock`);
    }
    if (!manifest.profiles[test.profile]) {
      abort(`${test.name}: unknown profile ${test.profile}`);
    }
    if (!callKinds.has(test.call)) {
      abort(`${test.name}: unknown call kind ${test.call}`);
    }
    if (!fs.existsSync(testFilePath(test))) {
      abort(`${test.name}: ${path.relative(repoRoot, testFilePath(test))} does not exist`);
    }
  }
  return manifest;
}

function testFilePath(test) {
  return path.join(repoRoot, 'tests', `${test.name}.browser.js`);
}

// Shell VITE_ variables would override .env files and the profile in every child Vite, so they
// are dropped to keep runs reproducible. The .env files are still read and validated below.
function removeShellViteVariables() {
  const removed = Object.keys(process.env).filter(key => key.startsWith('VITE_'));
  for (const key of removed) {
    delete process.env[key];
  }
  return removed;
}

function validateProfiles(manifest, loadEnv) {
  const fileEnv = loadEnv(viteMode, repoRoot, 'VITE_');
  const problems = [];
  for (const [profileId, profile] of Object.entries(manifest.profiles)) {
    const effective = { ...fileEnv, ...profile.env };
    const apiBase = effective.VITE_API_BASE_URL ?? '';
    if (apiBase !== '' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(apiBase)) {
      problems.push(`${profileId}: VITE_API_BASE_URL must be empty or a loopback origin, got ${apiBase}`);
    }
    const tossKey = effective.VITE_TOSS_CLIENT_KEY ?? '';
    if (tossKey !== '' && !tossKey.startsWith('test_')) {
      problems.push(`${profileId}: VITE_TOSS_CLIENT_KEY must be absent or start with test_`);
    }
    for (const flag of featureFlags) {
      if (effective[flag] === 'true' && profile.env[flag] !== 'true') {
        problems.push(`${profileId}: ${flag}=true comes from a .env file; only a profile may enable it`);
      }
    }
  }
  return problems;
}

function validatePortSharing(tests) {
  const problems = [];
  const firstByPort = new Map();
  for (const test of tests) {
    const port = new URL(test.origin).port;
    const first = firstByPort.get(port);
    if (!first) {
      firstByPort.set(port, test);
      continue;
    }
    if (first.origin !== test.origin || first.server !== test.server || first.profile !== test.profile) {
      problems.push(`port ${port}: ${first.name} and ${test.name} disagree on origin, server or profile`);
    }
  }
  return problems;
}

function isPortListening(host, port) {
  return new Promise(resolve => {
    const socket = net.connect({ host, port });
    const finish = listening => {
      socket.destroy();
      resolve(listening);
    };
    socket.setTimeout(1000, () => finish(false));
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

async function findListeningPorts(ports) {
  const busy = [];
  for (const port of ports) {
    for (const host of ['127.0.0.1', '::1']) {
      if (await isPortListening(host, port)) {
        busy.push(`${host === '::1' ? '[::1]' : host}:${port}`);
      }
    }
  }
  return busy;
}

function loadPlaywright() {
  const repoRequire = createRequire(path.join(repoRoot, 'package.json'));
  try {
    return { playwright: repoRequire('playwright-core'), source: 'playwright-core from the repository' };
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
  }
  const modulePath = process.env.PAWBRIDGE_PLAYWRIGHT_MODULE;
  if (!modulePath) {
    abort('Playwright not found: playwright-core is not installed in this repository and PAWBRIDGE_PLAYWRIGHT_MODULE is not set.\n'
      + 'Set PAWBRIDGE_PLAYWRIGHT_MODULE to an installed playwright or playwright-core directory. This runner installs nothing.');
  }
  try {
    return { playwright: repoRequire(path.resolve(modulePath)), source: path.resolve(modulePath) };
  } catch (error) {
    abort(`PAWBRIDGE_PLAYWRIGHT_MODULE could not be loaded (${error.code || error.message})`);
  }
}

function childEnvironment(profile) {
  return { ...process.env, ...profile.env };
}

function runViteBuild(profileId, profile) {
  const outDir = path.join(buildRoot, profileId);
  const logPath = path.join(logDirectory, `build-${profileId}.log`);
  const args = [viteBin, 'build', '--mode', viteMode, '--outDir', outDir, '--emptyOutDir'];
  return new Promise((resolve, reject) => {
    const log = fs.createWriteStream(logPath);
    const child = spawn(process.execPath, args, { cwd: repoRoot, env: childEnvironment(profile), stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(log);
    child.stderr.pipe(log);
    child.once('error', reject);
    child.once('exit', code => {
      log.end();
      if (code === 0) {
        resolve();
        return;
      }
      reject(new RunnerAbort(`Build for profile ${profileId} failed (exit ${code}); see ${path.relative(repoRoot, logPath)}`));
    });
  });
}

// Dev servers get their own dependency cache. node_modules may be shared with another checkout,
// and a dev server there would otherwise re-optimize the same cache under a different mode.
function writeDevConfig() {
  const configPath = path.join(buildRoot, 'vite.dev.config.mjs');
  const source = [
    `import baseConfig from ${JSON.stringify(path.join(repoRoot, 'vite.config.ts'))};`,
    `import { mergeConfig } from 'vite';`,
    '',
    'export default mergeConfig(baseConfig, {',
    `  cacheDir: ${JSON.stringify(path.join(buildRoot, 'vite-cache'))},`,
    // Keep the dependency scan and the watcher away from the built index.html files. The payment SDK is only
    // imported dynamically at checkout, so pre-bundle it; otherwise a cold cache reloads the page mid-test.
    `  optimizeDeps: { entries: ['index.html'], include: ['@tosspayments/payment-sdk'] },`,
    `  server: { watch: { ignored: ['**/.browser-test-build/**'] } },`,
    '});',
    '',
  ].join('\n');
  fs.writeFileSync(configPath, source);
  return configPath;
}

function startServer(test, profile, devConfigPath) {
  const url = new URL(test.origin);
  const logPath = path.join(logDirectory, `${test.server}-${url.port}.log`);
  const common = ['--mode', viteMode, '--host', url.hostname, '--port', url.port, '--strictPort'];
  const args = test.server === 'dev'
    ? [viteBin, '--config', devConfigPath, ...common]
    : [viteBin, 'preview', ...common, '--outDir', path.join(buildRoot, test.profile)];
  const child = spawn(process.execPath, args, {
    cwd: repoRoot,
    env: childEnvironment(profile),
    stdio: ['ignore', 'pipe', 'pipe'],
    // A separate process group lets cleanup stop Vite together with any helper it spawned.
    detached: true,
  });
  const server = {
    origin: test.origin,
    kind: test.server,
    profile: test.profile,
    child,
    logPath,
    log: fs.createWriteStream(logPath),
    warmed: false,
    exited: false,
  };
  child.once('exit', () => {
    server.exited = true;
  });
  const watchOutput = chunk => {
    server.log.write(chunk);
    if (!server.warmed) {
      return;
    }
    for (const line of chunk.toString().split('\n')) {
      if (reloadLogPattern.test(line)) {
        reloadEvents.push({ origin: server.origin, during: currentTestLabel, line: stripAnsi(line).trim() });
      }
    }
  };
  child.stdout.on('data', watchOutput);
  child.stderr.on('data', watchOutput);
  startedServers.push(server);
  return server;
}

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}

async function waitForServer(server) {
  const deadline = Date.now() + serverStartTimeoutMs;
  while (Date.now() < deadline) {
    if (server.exited) {
      abort(`Server ${server.origin} exited during startup; see ${path.relative(repoRoot, server.logPath)}`);
    }
    try {
      const response = await fetch(server.origin + '/', { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        return;
      }
    } catch {
      // Not accepting connections yet.
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  abort(`Server ${server.origin} did not start within ${serverStartTimeoutMs / 1000}s; see ${path.relative(repoRoot, server.logPath)}`);
}

function stopServer(server) {
  if (server.exited) {
    return Promise.resolve();
  }
  return new Promise(resolve => {
    const forceTimer = setTimeout(() => {
      killGroup(server, 'SIGKILL');
    }, 5000);
    server.child.once('exit', () => {
      clearTimeout(forceTimer);
      resolve();
    });
    killGroup(server, 'SIGTERM');
  });
}

function killGroup(server, signal) {
  try {
    process.kill(-server.child.pid, signal);
  } catch {
    // The group is already gone.
  }
}

function cleanup() {
  if (!cleanupPromise) {
    cleanupPromise = stopEverything();
  }
  return cleanupPromise;
}

async function stopEverything() {
  for (const browser of launchedBrowsers.splice(0)) {
    await browser.close().catch(() => {});
  }
  await Promise.all(startedServers.map(stopServer));
  for (const server of startedServers) {
    server.log.end();
  }
}

// process 'exit' handlers must be synchronous, so this is the last-resort path only.
function killServersSynchronously() {
  for (const server of startedServers) {
    if (!server.exited) {
      killGroup(server, 'SIGKILL');
    }
  }
}

function hostOf(requestUrl) {
  try {
    const url = new URL(requestUrl);
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) {
      return null;
    }
    return url.hostname;
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname) {
  return loopbackHosts.has(hostname) || /^127\.\d+\.\d+\.\d+$/.test(hostname);
}

function hostResolverArgument(allowHosts) {
  const rules = ['MAP * ~NOTFOUND', 'EXCLUDE localhost', 'EXCLUDE 127.0.0.1'];
  for (const host of allowHosts) {
    rules.push(`EXCLUDE ${host}`);
  }
  return `--host-resolver-rules=${rules.join(', ')}`;
}

function createBrowserPool(playwright) {
  const browsersByAllowList = new Map();
  return async function browserFor(allowHosts) {
    const key = [...allowHosts].sort().join(',');
    if (browsersByAllowList.has(key)) {
      return browsersByAllowList.get(key);
    }
    const executablePath = process.env.PAWBRIDGE_CHROMIUM_PATH;
    const browser = await playwright.chromium.launch({
      headless: true,
      ...(executablePath ? { executablePath } : { channel: 'chrome' }),
      // Without --no-proxy-server a system proxy would resolve hosts outside Chromium's rules.
      args: [hostResolverArgument(allowHosts), '--no-proxy-server'],
    });
    browsersByAllowList.set(key, browser);
    launchedBrowsers.push(browser);
    return browser;
  };
}

// Records requests that reached the network stack for a non-loopback host. Requests a route
// fulfilled or aborted never do; a DNS failure means Chromium tried and the resolver rule stopped it.
function watchNetwork(context, allowHosts, networkReport) {
  const isWatched = hostname => hostname !== null && !isLoopbackHost(hostname) && !allowHosts.includes(hostname);
  context.on('requestfailed', request => {
    const hostname = hostOf(request.url());
    if (!isWatched(hostname)) {
      return;
    }
    const errorText = request.failure()?.errorText || '';
    if (errorText.includes('ERR_NAME_NOT_RESOLVED')) {
      networkReport.attempts.push(`${request.method()} ${hostname} (blocked by resolver)`);
    }
  });
  context.on('requestfinished', request => {
    const hostname = hostOf(request.url());
    if (!isWatched(hostname)) {
      return;
    }
    // A fulfilled route has no server address; only a real network response has one.
    const check = request.response()
      .then(response => response?.serverAddr())
      .then(serverAddress => {
        if (serverAddress) {
          networkReport.attempts.push(`${request.method()} ${hostname} (reached ${serverAddress.ipAddress})`);
        }
      })
      .catch(() => {});
    networkReport.pendingChecks.push(check);
  });
  context.on('page', page => {
    page.on('websocket', socket => {
      const hostname = hostOf(socket.url());
      if (isWatched(hostname)) {
        networkReport.attempts.push(`WebSocket ${hostname}`);
      }
    });
  });
}

async function prepareContext(context, test, networkReport) {
  const allowHosts = allowedHostsFor(test);
  context.setDefaultTimeout(defaultTimeoutMs);
  watchNetwork(context, allowHosts, networkReport);
  // The app itself loads fonts, scripts and images from other hosts (index.html, login buttons).
  // Test routes run first; whatever they leave unhandled is aborted here, so the page sees an
  // offline failure. Only a test that continues such a request reaches the resolver rule.
  const isUnmockedExternal = url => {
    const hostname = hostOf(url.href);
    return hostname !== null && !isLoopbackHost(hostname) && !allowHosts.includes(hostname);
  };
  await context.route(isUnmockedExternal, route => {
    networkReport.abortedHosts.add(new URL(route.request().url()).hostname);
    return route.abort('blockedbyclient');
  });
}

// Tests that receive the browser create their own contexts; each one is prepared the same way.
function createPreparedBrowser(browser, test, networkReport, contexts) {
  return new Proxy(browser, {
    get(target, property) {
      if (property === 'newContext') {
        return async options => {
          const context = await target.newContext(options);
          contexts.push(context);
          await prepareContext(context, test, networkReport);
          return context;
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

function loadTestFunction(test) {
  const source = fs.readFileSync(testFilePath(test), 'utf8').trim();
  const expression = source.endsWith(';') ? source.slice(0, -1) : source;
  // Newlines keep a trailing line comment from swallowing the closing parenthesis.
  return new Function(`return (\n${expression}\n);`)();
}

function syntheticToken(role) {
  // Not a real secret: the video test only needs a well-formed HS512 token for the mocked API.
  const key = 'synthetic-local-video-key-not-a-production-secret-12345678901234567890';
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS512', typ: 'JWT' });
  const payload = encode({
    sub: 'video-test@example.invalid',
    userId: 7,
    name: '로컬 관리자',
    role,
    iat: issuedAt,
    exp: issuedAt + 3600,
  });
  const unsigned = `${header}.${payload}`;
  const signature = createHmac('sha512', key).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

function buildFixture(test) {
  const fixture = { origin: test.origin };
  const declared = test.fixture || {};
  if (declared.mode) {
    fixture.mode = declared.mode;
  }
  if (declared.thumbnailFile) {
    fixture.thumbnailFile = path.join(repoRoot, declared.thumbnailFile);
  }
  if (declared.syntheticTokens) {
    fixture.adminToken = syntheticToken('ROLE_ADMIN');
    fixture.userToken = syntheticToken('ROLE_USER');
  }
  if (declared.evidence === 'temporary-directory') {
    fixture.evidence = fs.mkdtempSync(path.join(os.tmpdir(), `pawbridge-${test.name}-`));
  }
  if (declared.phase) {
    fixture.phase = declared.phase;
  }
  return fixture;
}

function callArguments(test, page, browser, fixture) {
  switch (test.call) {
    case 'page':
      return [page];
    case 'page-origin':
      return [page, test.origin];
    case 'page-fixture':
      return [page, fixture];
    case 'browser-fixture':
      return [browser, fixture];
    case 'page-origin-evidence-phase':
      return [page, test.origin, fixture.evidence, fixture.phase];
    default:
      throw new Error(`Unknown call kind ${test.call}`);
  }
}

function withHardTimeout(promise, onTimeout) {
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      onTimeout();
      reject(new Error(`Hard timeout after ${hardTimeoutMs / 60_000} minutes`));
    }, hardTimeoutMs);
  });
  // The abandoned test promise may still reject after its context closes.
  promise.catch(() => {});
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function firstErrorLine(error) {
  const message = error instanceof Error ? error.message : String(error);
  const firstLine = stripAnsi(message).split('\n').find(line => line.trim() !== '') || 'Unknown error';
  // Synthetic JWTs in assertion messages are noise and should not be copied around.
  return firstLine.replace(/eyJ[A-Za-z0-9_.-]+/g, '[token]').trim().slice(0, 200);
}

async function runOneTest(test, iteration, browserFor) {
  const startedAt = Date.now();
  const networkReport = { attempts: [], abortedHosts: new Set(), pendingChecks: [] };
  const contexts = [];
  const browser = await browserFor(allowedHostsFor(test));
  const fixture = buildFixture(test);
  let page = null;
  let error = null;
  let result;
  activeTestRejections = [];
  try {
    if (test.call !== 'browser-fixture') {
      const context = await browser.newContext({ viewport });
      contexts.push(context);
      await prepareContext(context, test, networkReport);
      page = await context.newPage();
      if (test.preNavigate) {
        await page.goto(test.origin + '/', { waitUntil: 'load' });
      }
    }
    const preparedBrowser = createPreparedBrowser(browser, test, networkReport, contexts);
    const flow = loadTestFunction(test);
    const args = callArguments(test, page, preparedBrowser, fixture);
    const closeContexts = () => {
      for (const context of contexts) {
        context.close().catch(() => {});
      }
    };
    result = await withHardTimeout(Promise.resolve().then(() => flow(...args)), closeContexts);
  } catch (caught) {
    error = caught;
  }
  // Give handler assertions that fire just after the test's last step a moment to surface.
  await new Promise(resolve => setTimeout(resolve, rejectionGraceMs));
  const testRejections = activeTestRejections;
  activeTestRejections = null;
  if (!error && testRejections.length > 0) {
    error = new Error(`Unhandled rejection during the test: ${firstErrorLine(testRejections[0])}`);
  }
  await Promise.all(networkReport.pendingChecks);
  const unknownHosts = [...networkReport.abortedHosts].filter(host => !knownAppHosts.has(host) && !allowedHostsFor(test).includes(host));
  if (!error && unknownHosts.length > 0) {
    error = new Error(`Request to an unexpected external host: ${unknownHosts.sort().join(', ')}`);
  }
  if (!error && networkReport.attempts.length > 0) {
    error = new Error(`Non-loopback request attempted: ${[...new Set(networkReport.attempts)].join(', ')}`);
  }
  const label = `${test.name}${iteration > 1 ? `-${iteration}` : ''}`;
  // Leftovers from an earlier run of this test must not be read as this run's evidence.
  for (const stale of [
    path.join(failureDirectory, `${label}.png`),
    path.join(failureDirectory, `${label}.txt`),
    path.join(resultDirectory, `${label}.json`),
  ]) {
    fs.rmSync(stale, { force: true });
  }
  if (error && page && !page.isClosed()) {
    await page.screenshot({ path: path.join(failureDirectory, `${label}.png`), fullPage: true, timeout: 10_000 }).catch(() => {});
  }
  if (error) {
    // The table shows one line; the full message (with Playwright's call log) is what explains a timeout.
    const fullMessage = stripAnsi(error instanceof Error ? error.stack || error.message : String(error));
    fs.writeFileSync(path.join(failureDirectory, `${label}.txt`), fullMessage.replace(/eyJ[A-Za-z0-9_.-]+/g, '[token]') + '\n');
  }
  if (!error) {
    fs.writeFileSync(path.join(resultDirectory, `${label}.json`), JSON.stringify(result ?? null, null, 2) + '\n');
  }
  for (const context of contexts) {
    await context.close().catch(() => {});
  }
  return {
    name: test.name,
    iteration,
    status: error ? 'FAIL' : 'PASS',
    seconds: ((Date.now() - startedAt) / 1000).toFixed(1),
    detail: error ? firstErrorLine(error) : describeExtras(fixture, networkReport),
  };
}

function describeExtras(fixture, networkReport) {
  const parts = [];
  if (fixture.evidence) {
    parts.push(`evidence ${fixture.evidence}`);
  }
  if (networkReport.abortedHosts.size > 0) {
    parts.push(`aborted unmocked: ${[...networkReport.abortedHosts].sort().join(' ')}`);
  }
  return parts.join('; ');
}

async function warmDevServer(server, browserFor) {
  const browser = await browserFor([]);
  const context = await browser.newContext({ viewport });
  try {
    await prepareContext(context, { allowHosts: [] }, { attempts: [], abortedHosts: new Set(), pendingChecks: [] });
    const page = await context.newPage();
    await page.goto(server.origin + '/', { waitUntil: 'networkidle', timeout: warmUpTimeoutMs });
  } finally {
    await context.close().catch(() => {});
  }
  server.warmed = true;
}

function printTable(rows) {
  const headers = ['TEST', 'RUN', 'STATUS', 'SEC', 'DETAIL'];
  const cells = rows.map(row => [row.name, String(row.iteration), row.status, row.seconds, row.detail]);
  const widths = headers.map((header, column) => Math.max(header.length, ...cells.map(cell => cell[column].length)));
  // The last column is free text, so it is not padded.
  const format = cell => cell.map((value, column) => column === cell.length - 1 ? value : value.padEnd(widths[column])).join('  ');
  console.log('');
  console.log(format(headers));
  for (const cell of cells) {
    console.log(format(cell));
  }
}

function selectTests(manifest, names) {
  if (names.length === 0) {
    return manifest.tests;
  }
  const byName = new Map(manifest.tests.map(test => [test.name, test]));
  const unknown = names.filter(name => !byName.has(name));
  if (unknown.length > 0) {
    abort(`Unknown test(s): ${unknown.join(', ')}`);
  }
  return [...new Set(names)].map(name => byName.get(name));
}

async function main() {
  process.chdir(repoRoot);
  const { names, repeat } = parseArguments(process.argv.slice(2));
  const manifest = loadManifest();
  const ignoredVariables = removeShellViteVariables();
  if (ignoredVariables.length > 0) {
    console.log(`Ignoring shell variables (profiles and .env files decide): ${ignoredVariables.join(', ')}`);
  }
  const { loadEnv } = await import('vite');
  const problems = [...validateProfiles(manifest, loadEnv), ...validatePortSharing(manifest.tests)];
  if (problems.length > 0) {
    abort(`Refusing to run:\n  ${problems.join('\n  ')}`);
  }

  const selected = selectTests(manifest, names);
  const rows = [];

  const manifestPorts = [...new Set(manifest.tests.map(test => Number(new URL(test.origin).port)))];
  const busy = await findListeningPorts([...manifestPorts, ...reservedApiPorts]);
  if (busy.length > 0) {
    abort(`Refusing to run: something already listens on ${busy.join(', ')}. Stop it first; this runner stops only servers it started.`);
  }
  const { playwright, source } = loadPlaywright();
  console.log(`Playwright: ${source}; browser: ${process.env.PAWBRIDGE_CHROMIUM_PATH || 'system Chrome (channel chrome)'}`);

  for (const directory of [logDirectory, resultDirectory, failureDirectory]) {
    fs.mkdirSync(directory, { recursive: true });
  }
  const serverTests = new Map();
  for (const test of selected) {
    if (!serverTests.has(test.origin)) {
      serverTests.set(test.origin, test);
    }
  }
  const previewProfiles = new Set([...serverTests.values()].filter(test => test.server === 'preview').map(test => test.profile));
  for (const profileId of previewProfiles) {
    console.log(`Building preview profile ${profileId} ...`);
    await runViteBuild(profileId, manifest.profiles[profileId]);
  }
  const devConfigPath = writeDevConfig();
  const browserFor = createBrowserPool(playwright);
  for (const test of serverTests.values()) {
    console.log(`Starting ${test.server} server ${test.origin} (${test.profile}) ...`);
    const server = startServer(test, manifest.profiles[test.profile], devConfigPath);
    await waitForServer(server);
    if (server.kind === 'dev') {
      await warmDevServer(server, browserFor);
    }
  }

  for (let iteration = 1; iteration <= repeat; iteration++) {
    for (const test of selected) {
      if (interruptedBy) {
        break;
      }
      currentTestLabel = repeat > 1 ? `${test.name} (run ${iteration})` : test.name;
      const row = await runOneTest(test, iteration, browserFor);
      console.log(`${row.status} ${currentTestLabel} ${row.seconds}s${row.status === 'FAIL' ? ': ' + row.detail : ''}`);
      rows.push(row);
    }
  }
  currentTestLabel = 'shutdown';
  printTable(rows);
  if (reloadEvents.length > 0) {
    console.log('\nRun marked failed: Vite reloaded pages during the run, so results may mix module versions.');
    for (const event of reloadEvents) {
      console.log(`  ${event.origin} during ${event.during}: ${event.line}`);
    }
  }
  if (lateRejections.length > 0) {
    console.log('\nPromises a test left behind rejected later (not counted as failures):');
    for (const rejection of lateRejections) {
      console.log(`  during ${rejection.during}: ${rejection.line}`);
    }
  }
  const failed = rows.some(row => row.status === 'FAIL') || reloadEvents.length > 0;
  return failed ? 1 : 0;
}

process.on('exit', killServersSynchronously);
// A test can leave a promise behind (for example waitForResponse) that rejects after the test
// returned or failed. It belongs to that test, so it is reported instead of crashing the run.
process.on('unhandledRejection', reason => {
  if (activeTestRejections) {
    activeTestRejections.push(reason);
    return;
  }
  lateRejections.push({ during: currentTestLabel, line: firstErrorLine(reason) });
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    if (interruptedBy) {
      return;
    }
    interruptedBy = signal;
    console.error(`\nReceived ${signal}; stopping servers ...`);
    await cleanup();
    process.exit(130);
  });
}

let exitCode = 1;
try {
  exitCode = await main();
} catch (error) {
  if (error instanceof RunnerAbort) {
    console.error(error.message);
    exitCode = 2;
  } else {
    console.error(error);
  }
} finally {
  await cleanup();
}
process.exit(interruptedBy ? 130 : exitCode);
