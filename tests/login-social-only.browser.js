// Login offers only Naver and Google sign-in, even against a local backend (the build with a local API address).
// Email login, password reset and password change were removed; their old addresses go to the login page.
async page => {
  const origin = 'http://127.0.0.1:5271';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/*', async route => {
    const request = route.request();
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(request.url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/') || !['xhr', 'fetch'].includes(request.resourceType())) return route.continue();
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });
  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto(origin + '/login');
    await page.getByRole('heading', { level: 1, name: '로그인' }).waitFor();
    assert(await page.getByRole('button', { name: /네이버/ }).count() === 1 && await page.getByRole('button', { name: /구글/ }).count() === 1, `social-buttons-${width}`);
    assert(await page.getByText(/이메일/).count() === 0, `no-email-login-${width}`);
    assert(await page.locator('input[type="password"], input[type="email"]').count() === 0, `no-credential-fields-${width}`);
    assert(await page.getByRole('link', { name: '비밀번호 찾기' }).count() === 0, `no-reset-link-${width}`);
  }
  // Old addresses go to the login page.
  for (const path of ['/reset-password', '/signup']) {
    await page.goto(origin + path);
    await page.waitForURL(origin + '/login');
    assert(true, `redirect-${path}`);
  }
  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
