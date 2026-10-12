const fs = require('node:fs');
const path = require('node:path');
async function main() {
  const runtime = process.env.PAWBRIDGE_PLAYWRIGHT_MODULE;
  const executable = process.env.PAWBRIDGE_BROWSER_EXECUTABLE;
  if (!runtime || !path.isAbsolute(runtime) || !executable || !path.isAbsolute(executable)) throw new Error('Existing browser runtime paths required');
  const origin = process.env.PAWBRIDGE_VISIT_TEST_ORIGIN || 'http://127.0.0.1:5192';
  if (new URL(origin).hostname !== '127.0.0.1') throw new Error('Local test origin required');
  const evidence = '/tmp/pawbridge-visitor-browser';
  fs.mkdirSync(evidence, { recursive: true });
  const { chromium } = require(runtime);
  const browser = await chromium.launch({ headless: true, executablePath: executable });
  try {
    const flow = new Function('return (' + fs.readFileSync(path.join(__dirname, 'visits.browser.js'), 'utf8') + ');')();
    console.log(JSON.stringify(await flow(browser, { origin, evidence })));
  } finally { await browser.close(); }
}
main().catch(error => { console.error('Visitor browser check failed: ' + error.message); process.exitCode = 1; });
