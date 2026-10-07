// Uses an already installed Playwright runtime; never installs tools or prints credentials.
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const fixturePath = process.env.PAWBRIDGE_NOTES_FIXTURE_FILE;
  const modulePath = process.env.PAWBRIDGE_PLAYWRIGHT_MODULE;
  if (!fixturePath || !path.isAbsolute(fixturePath) || !modulePath || !path.isAbsolute(modulePath)) {
    throw new Error('Set absolute PAWBRIDGE_NOTES_FIXTURE_FILE and PAWBRIDGE_PLAYWRIGHT_MODULE paths.');
  }
  const accounts = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  if (!Array.isArray(accounts) || accounts.length !== 3 || !accounts.every(account =>
    /^note-[a-z0-9-]+@example\.invalid$/.test(account.email) && Number.isSafeInteger(account.userId)
    && account.userId > 0 && typeof account.password === 'string' && typeof account.token === 'string')) {
    throw new Error('Use three task-owned synthetic local dev accounts, not production credentials.');
  }
  const { chromium } = require(modulePath);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(15000);
    const source = fs.readFileSync(path.join(__dirname, 'private-notes.browser.js'), 'utf8');
    const flow = new Function(`return (${source});`)();
    console.log(JSON.stringify(await flow(page, accounts)));
  } finally { await browser.close(); }
}

main().catch(() => {
  // Do not print request/fixture objects or an exception that could contain credentials.
  console.error('Local private-note browser verification failed. Inspect the synthetic failure screenshot and test step.');
  process.exitCode = 1;
});
