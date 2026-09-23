// playwright-cli run-code --filename=tests/member-auth.browser.js
// Vite 127.0.0.1:5201. 모든 API는 모의 응답이며 실제 계정은 변경하지 않는다.
async page => {
  const origin = 'http://127.0.0.1:5201';
  const checks = [], errors = [], writes = [];
  let mode = 'error';
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const onError = e => errors.push(e.message);
  const handler = async route => {
    const request = route.request();
    const path = request.url().replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    if (!path.startsWith('/api/')) return route.continue();
    if (request.method() === 'GET') {
      if (path.endsWith('/stats/status')) return route.fulfill({ json: [] });
      if (path.endsWith('/stats/today')) return route.fulfill({ json: { date: '2026-09-23', rescuedToday: 0, adoptedToday: 0 } });
      return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, code: 200, data: [] } });
    }
    writes.push({ path, body: request.postDataJSON() });
    if (mode === 'network') return route.abort();
    if (mode !== 'success') return route.fulfill({ status: 400, json: { code: 400, message: mode === 'malformed' ? { detail: 'not a string' } : '서버 테스트 안내', data: null } });
    const data = path === '/api/auth/login'
      ? { userId: 321, email: 'member@example.invalid', name: '검증회원', role: 'ROLE_SHELTER', careRegNo: null, accessToken: 'test-only-token', refreshToken: 'test-only-refresh' }
      : path === '/api/users/signup' ? { userId: 321, email: 'member@example.invalid', name: '검증회원', nickname: '새별명' }
      : path === '/api/v1/email/verify' ? { verified: true } : null;
    return route.fulfill({ json: { code: 200, data, message: '성공' } });
  };
  await page.addInitScript(() => { window.__authAlerts = []; window.alert = message => window.__authAlerts.push(message); });
  await page.route('**/api/**', handler);
  page.on('pageerror', onError);
  const notice = async (action, expected) => {
    const count = await page.evaluate(() => window.__authAlerts.length);
    await action();
    await page.waitForFunction(count => window.__authAlerts.length > count, count);
    assert(await page.evaluate(() => window.__authAlerts.at(-1)) === expected, `Wrong alert: ${expected}`);
  };
  const lastWrite = (path, body) => {
    const last = writes.at(-1);
    assert(last.path === path && JSON.stringify(last.body) === JSON.stringify(body), `Wrong request: ${JSON.stringify(last)}`);
  };
  const layout = async (name, width) => {
    assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `Overflow ${name} ${width}`);
    await page.screenshot({ path: `/tmp/member-auth-${name}-${width}.png`, fullPage: true });
  };
  try {
    for (const width of [1920, 390]) {
      await page.setViewportSize({ width, height: width === 1920 ? 1080 : 844 });
      await page.goto(`${origin}/login`);
      await page.evaluate(() => localStorage.clear());
      await page.getByPlaceholder('이메일 주소를 입력하세요').fill('member@example.invalid');
      await page.getByPlaceholder('비밀번호를 입력하세요', { exact: true }).fill('test-password');
      for (const [failure, expected] of [['error', '서버 테스트 안내'], ['malformed', '이메일 또는 비밀번호가 일치하지 않습니다.'], ['network', '이메일 또는 비밀번호가 일치하지 않습니다.']]) {
        mode = failure;
        await page.locator('button[type="submit"]').click();
        await page.getByText(expected, { exact: true }).first().waitFor();
        lastWrite('/api/auth/login', { email: 'member@example.invalid', password: 'test-password' });
      }
      await layout('login-error', width);
      mode = 'success';
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(`${origin}/`);
      const state = await page.evaluate(() => JSON.parse(localStorage.getItem('auth-storage')).state);
      assert(state.user.id === 321 && state.user.role === 'ROLE_SHELTER' && state.user.careRegNo === null && state.accessToken === 'test-only-token', 'Login mapping changed');
      await page.evaluate(() => localStorage.clear());
      checks.push(`login error/fallback/payload/session ${width}`);

      await page.goto(`${origin}/signup`);
      await page.getByPlaceholder('이메일 주소를 입력하세요').fill('member@example.invalid');
      mode = 'error';
      await notice(() => page.getByRole('button', { name: '인증코드 발송', exact: true }).click(), '서버 테스트 안내');
      mode = 'success';
      await notice(() => page.getByRole('button', { name: '인증코드 발송', exact: true }).click(), '인증 코드가 이메일로 발송되었습니다.');
      lastWrite('/api/v1/email/send', { email: 'member@example.invalid' });
      for (let i = 0; i < 6; i++) await page.locator(`#verify-code-${i}`).fill(String(i + 1));
      mode = 'malformed';
      await notice(() => page.getByRole('button', { name: '인증 확인', exact: true }).click(), '인증 코드 검증에 실패했습니다');
      mode = 'success';
      await notice(() => page.getByRole('button', { name: '인증 확인', exact: true }).click(), '이메일 인증이 완료되었습니다!');
      lastWrite('/api/v1/email/verify', { email: 'member@example.invalid', code: '123456' });
      await page.getByPlaceholder('이름을 입력하세요').fill('검증회원');
      await page.getByPlaceholder('비밀번호를 입력하세요', { exact: true }).fill('test-password');
      await page.getByPlaceholder('비밀번호를 다시 한번 입력하세요').fill('test-password');
      mode = 'error';
      await notice(() => page.locator('button[type="submit"]').click(), '서버 테스트 안내');
      await layout('signup-error', width);
      mode = 'success';
      await notice(() => page.locator('button[type="submit"]').click(), '회원가입 성공!\n환영합니다, 검증회원님!');
      await page.waitForURL('**/login');
      lastWrite('/api/users/signup', { email: 'member@example.invalid', name: '검증회원', password: 'test-password', rePassword: 'test-password', role: 'ROLE_USER' });
      checks.push(`signup/send/verify/errors/payload ${width}`);

      await page.goto(`${origin}/reset-password`);
      await page.getByPlaceholder('이메일 주소를 입력하세요').fill('member@example.invalid');
      mode = 'error';
      await notice(() => page.locator('button[type="submit"]').click(), '서버 테스트 안내');
      mode = 'success';
      await notice(() => page.locator('button[type="submit"]').click(), '인증 코드가 이메일로 발송되었습니다.');
      lastWrite('/api/auth/password/reset-request', { email: 'member@example.invalid' });
      for (let i = 0; i < 6; i++) await page.locator(`#code-${i}`).fill(String(i + 1));
      await page.getByPlaceholder('새 비밀번호를 입력하세요').fill('New-test1!');
      await page.getByPlaceholder('비밀번호를 다시 한번 입력하세요').fill('New-test1!');
      mode = 'malformed';
      await notice(() => page.locator('button[type="submit"]').click(), '비밀번호 재설정에 실패했습니다');
      await layout('reset-error', width);
      mode = 'success';
      await notice(() => page.locator('button[type="submit"]').click(), '비밀번호가 재설정되었습니다. 새로운 비밀번호로 로그인해주세요.');
      await page.waitForURL('**/login');
      lastWrite('/api/auth/password/reset', { email: 'member@example.invalid', code: '123456', newPassword: 'New-test1!' });
      checks.push(`reset/send/errors/payload ${width}`);
    }
    assert(errors.length === 0, errors.join(', '));
    return { checks, mutations: writes.length, pageErrors: errors };
  } finally {
    page.off('pageerror', onError);
    await page.unroute('**/api/**', handler);
  }
}
