const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const modulePath = process.env.PAWBRIDGE_PLAYWRIGHT_MODULE;
  const executablePath = process.env.PAWBRIDGE_CHROMIUM_PATH;
  const origin = process.env.PAWBRIDGE_SECURITY_ORIGIN || 'http://127.0.0.1:5260';
  if (!modulePath || !executablePath || !path.isAbsolute(modulePath) || !path.isAbsolute(executablePath)) {
    throw new Error('Explicit existing Playwright and Chromium paths are required');
  }
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) throw new Error('Loopback test origin required');
  const { chromium } = require(modulePath);
  const browser = await chromium.launch({ headless: true, executablePath });
  const results = [];
  try {
    for (const file of ['dependency-security.browser.js', 'chat-existing-room-cache.browser.js', 'blocked-author-cache.browser.js', 'api-response-boundary.browser.js']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const page = await context.newPage();
      try {
        page.setDefaultTimeout(15000);
        // Start on a blank shell; each scenario installs its mocks before navigation.
        if (file === 'api-response-boundary.browser.js') {
          await page.route('**/*', route => {
            const url = new URL(route.request().url());
            if (url.pathname.startsWith('/api/')) return route.fulfill({ json: { code: 200, data: [] } });
            return url.origin === origin ? route.continue() : route.abort();
          });
          await page.goto(origin + '/login', { waitUntil: 'domcontentloaded' });
        }
        const source = fs.readFileSync(path.join(__dirname, file), 'utf8').trim().replace(/;$/, '');
        const flow = new Function('return (' + source + ');')();
        results.push({ file, result: await flow(page, origin) });
        console.log('PASS ' + file);
      } catch (error) {
        await page.screenshot({ path: '/tmp/pawbridge-dependency-security-failure.png', fullPage: true }).catch(() => {});
        throw error;
      } finally { await context.close(); }
    }
    console.log(JSON.stringify({ scenarios: results, productionVerified: false }));
  } finally { await browser.close(); }
}
main().catch(error => {
  console.error('Dependency browser regression failed: ' + String(error.message).slice(0, 2000));
  process.exitCode = 1;
});
