// Reuses the installed Playwright runtime and task-owned local accounts; prints no credentials.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function localFaults(fixture) {
  const state = path.dirname(fixture);
  const owner = JSON.parse(fs.readFileSync(path.join(state,'owner.json'),'utf8'));
  const started = JSON.parse(fs.readFileSync(path.join(state,'member-chat-started.json'),'utf8'));
  if (owner.project !== 'pawbridge-dev' || !started.includes('community-chat-peer')) {
    throw new Error('Task-owned local dev fault target required');
  }
  const docker = (...args) => execFileSync('docker',['--host','unix:///var/run/docker.sock',...args],
    {encoding:'utf8',timeout:30000,stdio:['ignore','pipe','pipe']});
  const peer = 'pawbridge-dev-community-chat-peer-1';
  const redis = 'pawbridge-dev-redis-1';
  for (const target of [peer,redis]) {
    if (docker('inspect','--format','{{index .Config.Labels "com.docker.compose.project"}}',target).trim() !== 'pawbridge-dev') {
      throw new Error('Local Compose ownership mismatch');
    }
  }
  let stopped = false, paused = false, timer;
  const resumeRedis = async () => {
    clearTimeout(timer);
    if (paused) { docker('unpause',redis); paused = false; }
  };
  const startPeer = async () => {
    if (!stopped) return;
    docker('start',peer); stopped = false;
    console.log('[chat-check] peer-container-started');
    const account = JSON.parse(fs.readFileSync(fixture,'utf8'))[0];
    const statuses = {};
    // Starting a JVM container is not application readiness. Probe the peer's authorized REST path.
    for (let attempt = 0; attempt < 60; attempt++) {
      const ready = await fetch('http://localhost:28180/api/chats', {
        headers: { Authorization: 'Bearer ' + account.token }, signal: AbortSignal.timeout(2000),
      }).then(response => {
        statuses[response.status] = (statuses[response.status] || 0) + 1;
        return response.ok;
      }).catch(() => { statuses.transport = (statuses.transport || 0) + 1; return false; });
      if (ready) return;
      await new Promise(resolve => setTimeout(resolve,1000));
    }
    console.log('[chat-check] peer-readiness-statuses ' + JSON.stringify(statuses));
    throw new Error('Restarted local peer readiness failed');
  };
  return {
    stopPeer: async () => { docker('stop','-t','5',peer); stopped = true; },
    startPeer,
    pauseRedis: async () => {
      docker('pause',redis); paused = true;
      timer = setTimeout(() => void resumeRedis().catch(()=>{}),6000);
    },
    resumeRedis,
    restore: async () => { await resumeRedis(); await startPeer(); },
  };
}

async function main() {
  const fixture = process.env.PAWBRIDGE_CHAT_FIXTURE_FILE;
  const runtime = process.env.PAWBRIDGE_PLAYWRIGHT_MODULE;
  const executable = process.env.PAWBRIDGE_BROWSER_EXECUTABLE;
  if (![fixture, runtime, executable].every(value => value && path.isAbsolute(value))) {
    throw new Error('Explicit existing runtime, browser and private local fixture paths required');
  }
  const accounts = JSON.parse(fs.readFileSync(fixture, 'utf8'));
  if (!Array.isArray(accounts) || accounts.length !== 3 || !accounts.every(account =>
    /^note-chat-[a-z0-9-]+@example\.invalid$/.test(account.email)
    && Number.isSafeInteger(account.userId) && typeof account.password === 'string' && typeof account.token === 'string')) {
    throw new Error('Three synthetic local accounts required');
  }
  const { chromium } = require(runtime);
  for (const port of [28080, 28180, 28081, 28083]) {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      ready = await fetch(`http://127.0.0.1:${port}/actuator/health`)
        .then(response => response.ok).catch(() => false);
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (!ready) throw new Error('Local application readiness failed');
  }
  const browser = await chromium.launch({ executablePath: executable, headless: true });
  let faults;
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(15000);
    page.on('console', entry => {
      if (/^\[chat-check\] raw-failure (Transport failed|CONNECT timed out|Send rejected|Application receipt timed out)$/.test(entry.text())) console.log(entry.text());
      if (/^\[chat-check\] raw-response [a-zA-Z,]+$/.test(entry.text())) console.log(entry.text());
      if (/^\[chat-check\] raw-(send|ack) \d+$/.test(entry.text())) console.log(entry.text());
      if (/^\[chat-check\] security-[a-z-]+$/.test(entry.text())) console.log(entry.text());
    });
    page.on('response', response => {
      if (new URL(response.url()).pathname === '/api/chats/connection-ticket') {
        console.log('[chat-check] ticket-status ' + response.status());
      }
    });
    page.on('websocket', socket => {
      let shown = 0;
      socket.on('framereceived', frame => {
        const command = String(frame.payload).trimStart().split('\n')[0];
        if (['CONNECTED', 'ERROR'].includes(command)) console.log('[chat-check] socket-' + command);
        if (command === 'MESSAGE' && shown++ < 3) {
          const text = String(frame.payload);
          try {
            const data = JSON.parse(text.slice(text.indexOf('\n\n')+2).replace(/\0\n?$/, ''));
            console.log('[chat-check] socket-payload ' + (data.status ? 'failure' : data.requestId ? 'receipt' : 'signal'));
          } catch { console.log('[chat-check] socket-payload parse-failed'); }
        }
      });
      socket.on('close', () => console.log('[chat-check] socket-closed'));
    });
    const recovery = process.env.PAWBRIDGE_CHAT_RECOVERY === 'true';
    const security = process.env.PAWBRIDGE_CHAT_SECURITY === 'true';
    if (recovery && security) throw new Error('Select only one local scenario');
    if (recovery) faults = localFaults(fixture);
    const source = fs.readFileSync(path.join(__dirname, recovery ? 'member-chat-recovery.browser.js' : security ? 'member-chat-security.browser.js' : 'member-chat.browser.js'), 'utf8');
    const flow = new Function(`return (${source});`)();
    const bulk = process.env.PAWBRIDGE_CHAT_BULK_ONLY;
    console.log(JSON.stringify(await flow(page, accounts, recovery ? faults : ['parallel','batch'].includes(bulk) ? bulk : bulk === 'true')));
  } finally {
    try { if (faults) await faults.restore(); } finally { await browser.close(); }
  }
}
main().catch(failure => {
  console.error('Failure type: ' + (failure instanceof Error ? failure.name : 'Unknown'));
  const safeFailure = ['Local recovery condition timed out', 'Restarted local peer readiness failed',
    'Same-tick double click emitted multiple sends', 'Ambiguous retry changed request ID',
    'ACK retry duplicated original', 'Peer failure prevented durable send',
    'Redis repair duplicated or lost a committed message', 'Forbidden connection accepted',
    'Forbidden frame did not close connection', 'Protocol error leaked submitted content',
    'Security connect timed out', 'Security ticket issuance timed out', 'Rejected as expected',
    'Closed as expected', 'Transport error'].find(message => failure?.message?.includes(message));
  if (safeFailure) console.error('Safe scenario failure: ' + safeFailure);
  console.error('Local member-chat browser verification failed; see the last safe test step and synthetic screenshot.');
  process.exitCode = 1;
});
