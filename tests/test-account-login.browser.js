// Existing email test accounts sign in at /login/test (no screen links here); /login stays Naver and Google only.
// A failed login keeps the inputs and shows the server message; a successful one stores the account and goes home.
async page => {
  const origin = 'http://127.0.0.1:5272';
  const checks = [], pageErrors = [], logins = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  page.on('pageerror', error => pageErrors.push(error.message));
  let accept = false;
  await page.route('**/*', async route => {
    const request = route.request();
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(request.url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (path === '/api/v1/auth/login' && request.method() === 'POST') {
      logins.push(request.postDataJSON());
      if (!accept) return route.fulfill({ status: 401, json: { code: 401, data: null, message: '이메일 또는 비밀번호가 일치하지 않습니다.' } });
      return route.fulfill({ status: 200, json: { code: 200, message: '로그인에 성공했습니다.', data: {
        userId: 901, email: 'tester@example.invalid', name: '시험회원', role: 'ROLE_SHELTER', careRegNo: 'TEST-0001', accessToken: 'test-only-token',
      } } });
    }
    if (!path.startsWith('/api/v1/') || !['xhr', 'fetch'].includes(request.resourceType())) return route.continue();
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });

  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: width === 1920 ? 1080 : 844 });
    await page.goto(origin + '/login/test');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('heading', { level: 1, name: '시험 계정 로그인' }).waitFor();
    assert(await page.locator('meta[name="robots"]').getAttribute('content').then(value => /noindex/.test(value || '')), `noindex-${width}`);
    const email = page.getByLabel('이메일');
    const password = page.getByLabel('비밀번호', { exact: true });
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    assert(await page.getByText('이메일을 입력해주세요.').count() === 1 && logins.length === 0, `empty-inputs-not-sent-${width}`);
    await email.fill('tester@example.invalid');
    await password.fill('wrong-password');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: '이메일 또는 비밀번호가 일치하지 않습니다.' }).waitFor({ timeout: 5000 });
    assert(page.url() === origin + '/login/test', `failure-stays-${width}`);
    assert(await email.inputValue() === 'tester@example.invalid' && await password.inputValue() === 'wrong-password', `failure-keeps-input-${width}`);
    assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `no-overflow-${width}`);
    logins.length = 0;
  }

  accept = true;
  await page.getByLabel('비밀번호', { exact: true }).fill('right-password');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await page.waitForURL(origin + '/', { timeout: 5000 });
  assert(JSON.stringify(logins) === JSON.stringify([{ email: 'tester@example.invalid', password: 'right-password' }]), 'sends-email-and-password');
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('auth-storage'))?.state);
  assert(state?.user?.id === 901 && state?.user?.role === 'ROLE_SHELTER' && state?.accessToken === 'test-only-token', 'success-stores-account');

  // The member login page does not point to the test page.
  await page.goto(origin + '/login');
  await page.getByRole('heading', { level: 1, name: '로그인' }).waitFor();
  assert(await page.locator('a[href*="/login/test"]').count() === 0, 'login-has-no-test-link');
  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
