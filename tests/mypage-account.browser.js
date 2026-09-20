// Run via playwright-cli run-code --filename=tests/mypage-account.browser.js.
// Start Vite on 127.0.0.1:5201. All API traffic is mocked, including mutations.
async page => {
  const origin = 'http://127.0.0.1:5201';
  const checks = [];
  const errors = [];
  const unexpected = [];
  const writes = [];
  let user;
  let release;
  let failNext = false;
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const onError = error => errors.push(error.message);
  const dialogs = () => page.evaluate(() => window.__accountDialogs);
  await page.addInitScript(() => {
    localStorage.setItem('pawbridge.analytics-consent.v1', 'denied');
    window.__accountDialogs = [];
    window.__acceptAccountLogout = false;
    window.alert = message => { window.__accountDialogs.push(message); };
    window.confirm = message => {
      window.__accountDialogs.push(message);
      return window.__acceptAccountLogout;
    };
  });
  const handler = async route => {
    const request = route.request();
    const path = request.url().replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    if (!path.startsWith('/api/')) return route.continue();
    if (path === '/api/users/me' && request.method() === 'GET') {
      return route.fulfill({ json: { code: 200, data: user } });
    }
    if (request.method() === 'PUT' && ['/api/users/me/nickname', '/api/users/me/password'].includes(path)) {
      const body = request.postDataJSON();
      writes.push({ path, body });
      await new Promise(resolve => { release = resolve; });
      const fail = failNext;
      failNext = false;
      if (!fail && path.endsWith('/nickname')) user.nickname = body.nickname;
      return route.fulfill({ status: fail ? 400 : 200, json: { code: fail ? 400 : 200, data: null, message: fail ? '테스트 요청 실패' : '성공' } });
    }
    unexpected.push(`${request.method()} ${path}`);
    await route.abort();
  };
  page.on('pageerror', onError);
  await page.route('**/api/**', handler);
  const profile = () => page.getByRole('button', { name: '프로필 정보' });
  const password = () => page.getByRole('button', { name: '비밀번호 변경' });
  const nickname = () => page.getByPlaceholder('2~30자의 한글, 영문, 숫자');
  const passwords = () => page.locator('main input[type="password"]');
  const submit = () => page.locator('main button[type="submit"]');
  const cancel = () => page.getByRole('button', { name: '취소', exact: true });
  const setUser = async (provider = 'LOCAL', role = 'ROLE_USER', tab = 'profile') => {
    user = { id: 10, userId: 10, email: 'member@example.invalid', name: '테스트회원', nickname: '기존별명', provider, role, createdAt: '2026-09-01T10:00:00' };
    await page.evaluate(({ user, tab }) => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user, accessToken: 'test-only-token' }, version: 0 }));
      sessionStorage.setItem('mypageActiveTab', tab);
    }, { user, tab });
    await page.goto(`${origin}/mypage`);
    await profile().waitFor();
  };
  const value = async (locator, expected, message) => assert(await locator.inputValue() === expected, message);
  const submitMutation = async (field, expected, fail) => {
    const count = writes.length;
    failNext = fail;
    release = null;
    await submit().click();
    await page.getByRole('button', { name: '변경 중...' }).waitFor();
    assert(await submit().isDisabled(), 'Pending submit must be disabled');
    assert(writes.length === count + 1, 'Submit must send exactly one mutation');
    assert(writes[count].path === `/api/users/me/${field}`, 'Wrong mutation endpoint');
    assert(JSON.stringify(writes[count].body) === JSON.stringify(expected), 'Wrong mutation payload');
    release();
    await page.getByRole('button', { name: '변경하기', exact: true }).waitFor();
    assert((await dialogs()).at(-1) === (fail ? '테스트 요청 실패' : `${field === 'nickname' ? '닉네임이' : '비밀번호가'} 변경되었습니다.`), 'Wrong result feedback');
  };
  try {
    await page.goto(`${origin}/login`);
    await setUser();
    const info = await page.locator('main input[readonly]').evaluateAll(inputs => inputs.map(input => input.value));
    assert(info.slice(0, 5).join('|') === 'member@example.invalid|테스트회원|기존별명|이메일 가입|일반 회원', 'Profile metadata changed');
    for (const width of [1920, 390]) {
      await page.setViewportSize({ width, height: width === 1920 ? 1080 : 844 });
      await profile().click();
      await nickname().fill('작성중별명');
      await password().click();
      await passwords().nth(0).fill('old-test-only');
      await passwords().nth(1).fill('new-test-only');
      await profile().click();
      await value(nickname(), '작성중별명', 'Nickname lost during tab switch');
      await cancel().click();
      await value(nickname(), '', 'Nickname cancel failed');
      await password().click();
      await value(passwords().nth(0), 'old-test-only', 'Current password lost during tab switch');
      await value(passwords().nth(1), 'new-test-only', 'New password lost during tab switch');
      await cancel().click();
      await value(passwords().nth(0), '', 'Password cancel failed');
      await value(passwords().nth(1), '', 'Password cancel failed');
      assert(writes.length === 0, 'Typing or cancelling must not submit');
      for (const tab of ['profile', 'password']) {
        await (tab === 'profile' ? profile() : password()).click();
        assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `Overflow at ${width}`);
        await page.mouse.move(0, 0);
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: `/tmp/mypage-${tab}-${width}.png`, fullPage: true, animations: 'disabled' });
      }
      checks.push(`draft preservation/cancel/layout ${width}`);
    }
    await profile().click();
    for (const invalid of ['', 'a', 'a'.repeat(31)]) {
      await nickname().fill(invalid);
      const count = (await dialogs()).length;
      await submit().click();
      assert((await dialogs()).length === count + 1 && writes.length === 0, 'Invalid nickname was submitted');
    }
    await nickname().fill('새별명');
    await submitMutation('nickname', { nickname: '새별명' }, false);
    await value(nickname(), '', 'Successful nickname must clear draft');
    await page.locator('main input[readonly]').nth(2).evaluate(input => {
      if (input.value !== '새별명') throw new Error('Nickname profile was not refreshed');
    });
    await nickname().fill('다른별명');
    await submitMutation('nickname', { nickname: '다른별명' }, true);
    await value(nickname(), '다른별명', 'Failed nickname must retain draft');
    await password().click();
    for (const [current, next] of [['', ''], ['old-test-only', ''], ['', 'new-test-only']]) {
      await passwords().nth(0).fill(current);
      await passwords().nth(1).fill(next);
      const count = writes.length;
      const notices = (await dialogs()).length;
      await submit().click();
      assert(writes.length === count && (await dialogs()).length === notices + 1, 'Incomplete password was submitted');
    }
    const body = { currentPassword: 'old-test-only', newPassword: 'new-test-only' };
    for (const fail of [true, false]) {
      await passwords().nth(0).fill(body.currentPassword);
      await passwords().nth(1).fill(body.newPassword);
      await submitMutation('password', body, fail);
      await value(passwords().nth(0), fail ? body.currentPassword : '', 'Wrong current password reset');
      await value(passwords().nth(1), fail ? body.newPassword : '', 'Wrong new password reset');
    }
    checks.push('nickname and password validation/payload/pending/success/error');
    for (const provider of ['GOOGLE', 'KAKAO', null, 'LOCAL']) {
      await setUser(provider, 'ROLE_USER', 'password');
      await page.getByRole('heading', { name: '비밀번호 변경', exact: true }).waitFor();
      const blocked = provider === 'GOOGLE' || provider === 'KAKAO';
      assert(await passwords().count() === (blocked ? 0 : 2), 'Wrong provider restriction');
      if (blocked) await page.getByText(`${provider === 'GOOGLE' ? '구글' : '카카오'} 가입 계정은 비밀번호를 변경할 수 없습니다.`).waitFor();
    }
    for (const role of ['ROLE_USER', 'ROLE_SHELTER', 'ROLE_ADMIN']) {
      await setUser('LOCAL', role);
      assert(await page.getByRole('button', { name: '내 보호소가 등록한 동물' }).count() === (role === 'ROLE_SHELTER' ? 1 : 0), 'Wrong shelter menu');
      for (const name of ['나의 위시리스트', '나의 장바구니', '나의 주문 목록']) {
        assert(await page.getByRole('button', { name }).count() === (role === 'ROLE_ADMIN' ? 1 : 0), 'Wrong market menu');
      }
    }
    for (const tab of ['wishlist', 'cart', 'orders']) {
      await setUser('LOCAL', 'ROLE_USER', tab);
      await page.getByRole('heading', { name: '프로필 정보', exact: true }).waitFor();
    }
    await page.locator('aside').getByRole('button', { name: '로그아웃' }).click();
    assert(page.url().endsWith('/mypage'), 'Cancelled logout navigated');
    await page.evaluate(() => { window.__acceptAccountLogout = true; });
    await page.locator('aside').getByRole('button', { name: '로그아웃' }).click();
    await page.waitForURL('**/login');
    const loggedOut = await page.evaluate(() => JSON.parse(localStorage.getItem('auth-storage')).state);
    assert(loggedOut.user === null && loggedOut.accessToken === null, 'Logout retained authentication');
    checks.push('provider restrictions, role menus, saved tabs, logout');
    assert(unexpected.length === 0, `Unexpected API traffic: ${unexpected.join(', ')}`);
    assert(errors.length === 0, `Page errors: ${errors.join(', ')}`);
    return { checks, mutations: writes.length, pageErrors: errors, unexpectedRequests: unexpected };
  } finally {
    if (release) release();
    page.off('pageerror', onError);
    await page.unroute('**/api/**', handler);
  }
}
