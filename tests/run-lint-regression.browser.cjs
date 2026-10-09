// Reuse an explicitly selected, installed Playwright runtime. Never install a browser.
const fs = require('node:fs');
const path = require('node:path');
async function main() {
  const modulePath = process.env.PAWBRIDGE_PLAYWRIGHT_MODULE;
  const executablePath = process.env.PAWBRIDGE_CHROMIUM_PATH;
  if (!modulePath || !executablePath || !path.isAbsolute(modulePath) || !path.isAbsolute(executablePath)) {
    throw new Error('Explicit existing Playwright module and Chromium paths are required');
  }
  const { chromium } = require(modulePath);
  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(12000);
    const flow = new Function('return (' + fs.readFileSync(path.join(__dirname, 'lint-regression.browser.js'), 'utf8') + ');')();
    const result = await flow(page);
    console.log(JSON.stringify(result));
  } finally {
    await browser.close();
  }
}
main().catch(error => {
  console.error('Local Lint browser regression failed: ' + String(error.message).slice(0, 1500));
  process.exitCode = 1;
});
