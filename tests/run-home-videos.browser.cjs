// Reuses an existing Playwright runtime. No package/browser installation or production account.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
async function main() {
  const modulePath = process.env.PAWBRIDGE_PLAYWRIGHT_MODULE;
  const mode = process.env.PAWBRIDGE_VIDEO_TEST_MODE || 'mock';
  if (!modulePath || !path.isAbsolute(modulePath) || !['mock', 'connected'].includes(mode)) throw new Error('Explicit existing runtime and local test mode required');
  const key = 'synthetic-local-video-key-not-a-production-secret-12345678901234567890';
  const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const sign = role => {
    const part = b64({ alg: 'HS512', typ: 'JWT' }) + '.' + b64({ sub: 'video-test@example.invalid', userId: 7, name: '로컬 관리자', role, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+3600 });
    return part + '.' + crypto.createHmac('sha512', key).update(part).digest('base64url');
  };
  const { chromium } = require(modulePath);
  const browser = await chromium.launch({ headless: true, executablePath: '/home/shyu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', failure => console.error('Local page error: ' + failure.message));
  page.setDefaultTimeout(12000);
  try {
    const flow = new Function('return (' + fs.readFileSync(path.join(__dirname, 'home-videos.browser.js'), 'utf8') + ');')();
    console.log(JSON.stringify(await flow(page, { mode, adminToken: sign('ROLE_ADMIN'), userToken: sign('ROLE_USER'), thumbnailFile: path.join(__dirname, '../src/assets/home/hero-happy-b.webp') })));
  } catch (failure) {
    await page.screenshot({ path: '/tmp/pawbridge-video-' + mode + '-failure.png', fullPage: true }).catch(() => {});
    // Only synthetic local accounts are used; print an assertion name, not request/credential objects.
    console.error('Local video browser check failed: ' + String(failure.message).slice(0, 1200).replace(/eyJ[A-Za-z0-9_.-]+/g, '[synthetic token]'));
    process.exitCode = 1;
  } finally { await browser.close(); }
}
main().catch(() => { console.error('Local browser runner initialization failed.'); process.exitCode = 1; });
