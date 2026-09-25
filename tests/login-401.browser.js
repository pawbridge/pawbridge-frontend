// playwright-cli run-code --filename=tests/login-401.browser.js
// Vite 127.0.0.1:5213. 모든 API 요청은 모의 응답이다.
async page => {
  const origin = 'http://127.0.0.1:5213';
  const checks = [];
  const errors = [];
  const unexpected = [];
  const requests = [];
  const profile = {
    id: 901,
    email: 'member@example.invalid',
    name: '검증회원',
    role: 'ROLE_USER',
    createdAt: '2026-09-25T00:00:00',
  };
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const onError = error => errors.push(error.message);
  const handler = async route => {
    const request = route.request();
    const path = request.url().replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    if (path === '/api/auth/login' && request.method() === 'POST') {
      requests.push('login');
      return route.fulfill({ status: 401, json: { code: 401, data: null, message: '이메일 또는 비밀번호가 일치하지 않습니다.' } });
    }
    if (path === '/api/users/me' && request.method() === 'GET') {
      requests.push('profile');
      return route.fulfill({ status: 401, json: { code: 401, data: null, message: '로그인이 필요합니다.' } });
    }
    if (path.startsWith('/api/')) {
      unexpected.push(`${request.method()} ${path}`);
      return route.abort();
    }
    return route.continue();
  };
  await page.route('**/api/**', handler);
  page.on('pageerror', onError);
  try {
    for (const width of [1920, 390]) {
      await page.setViewportSize({ width, height: width === 1920 ? 1080 : 844 });
      await page.goto(`${origin}/login`);
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      const email = page.getByPlaceholder('이메일 주소를 입력하세요');
      const password = page.getByPlaceholder('비밀번호를 입력하세요', { exact: true });
      await email.fill('member@example.invalid');
      await password.fill('wrong-password');
      await page.getByRole('button', { name: '로그인', exact: true }).click();
      await page.getByText('이메일 또는 비밀번호가 일치하지 않습니다.', { exact: true }).first().waitFor({ timeout: 5000 });
      assert(page.url() === `${origin}/login`, `Login failure redirected: ${page.url()}`);
      assert(await email.inputValue() === 'member@example.invalid', 'Email was cleared after login failure');
      assert(await password.inputValue() === 'wrong-password', 'Password was cleared after login failure');
      assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `Login overflow ${width}`);
      checks.push(`login 401 keeps error and input ${width}`);

      await page.evaluate(user => {
        localStorage.setItem('auth-storage', JSON.stringify({ state: { user, accessToken: 'test-only-token', refreshToken: 'test-only-refresh' }, version: 0 }));
      }, profile);
      await page.goto(`${origin}/mypage`);
      await page.waitForURL(`${origin}/login`, { timeout: 5000 });
      const state = await page.evaluate(() => JSON.parse(localStorage.getItem('auth-storage'))?.state);
      assert(state?.user === null && state?.accessToken === null, 'Protected API 401 did not clear auth');
      assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `Protected 401 overflow ${width}`);
      checks.push(`protected 401 clears session and redirects ${width}`);
    }
    assert(requests.filter(request => request === 'login').length === 2, 'Expected two login requests');
    assert(requests.filter(request => request === 'profile').length === 2, 'Expected two protected requests');
    assert(unexpected.length === 0, `Unexpected API traffic: ${unexpected.join(', ')}`);
    assert(errors.length === 0, `Page errors: ${errors.join(', ')}`);
    return { checks, requests, unexpected, errors };
  } finally {
    page.off('pageerror', onError);
    await page.unroute('**/api/**', handler);
  }
}
