const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const { PAWBRIDGE_PLAYWRIGHT_MODULE: modulePath, PAWBRIDGE_CHROMIUM_PATH: executablePath,
    PAWBRIDGE_MAP_EVIDENCE: evidenceDirectory, PAWBRIDGE_MAP_PHASE: phase = 'after',
    PAWBRIDGE_MAP_ORIGIN: origin = 'http://127.0.0.1:5262' } = process.env;
  if (![modulePath, executablePath, evidenceDirectory].every(value => value && path.isAbsolute(value))) {
    throw new Error('Existing browser/module and absolute evidence directory paths required');
  }
  if (!['before', 'after'].includes(phase)) throw new Error('Phase must be before or after');
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) throw new Error('Loopback origin required');
  const { chromium } = require(modulePath);
  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    const flow = new Function('return (' + fs.readFileSync(path.join(__dirname, 'map-security.browser.js'), 'utf8').trim() + ');')();
    const result = await flow(page, origin, evidenceDirectory, phase);
    result.baselineComparisonPassed = false;
    const baselineFile = path.join(evidenceDirectory, 'before.json');
    if (phase === 'after' && fs.existsSync(baselineFile)) {
      const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
      require('node:assert/strict').deepEqual(result.snapshots, baseline.snapshots, 'Map dimensions, palette, legend/markers or province contract changed');
      result.baselineComparisonPassed = true;
    }
    fs.writeFileSync(path.join(evidenceDirectory, `${phase}.json`), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
