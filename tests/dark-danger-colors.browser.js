// 모의 데이터로 위험색(필수 표시, 관리자 삭제 버튼)이 SHYU text/danger 값을 따르는지 본다.
// 라이트는 기존 빨강 그대로, 다크는 red/300(#FCA5A5)이어야 한다. 관리자 버튼은 공통 class의 dark:text-white에 지지 않아야 한다.
async page => {
  const origin = 'http://127.0.0.1:5274';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  const shelter = { id: 98, userId: 98, name: '검수보호소', nickname: '검수보호소', email: 'shelter@example.invalid', provider: 'LOCAL', role: 'ROLE_SHELTER', careRegNo: '311000000001', createdAt: '2026-09-01T00:00:00' };
  const admin = { id: 99, name: '관리자', email: 'admin@example.invalid', role: 'ROLE_ADMIN' };
  const animal = { animalId: 1, id: 1, species: 'DOG', breed: '믹스견', gender: 'MALE', neuterStatus: 'YES', status: 'PROTECT', careRegNo: '311000000001', apiSource: 'MANUAL', imageUrl: '' };
  const products = { items: [{ id: 1, skuId: 2, name: '산책 하네스', imageUrl: origin + '/favicon-96.png', status: 'ACTIVE', price: 19000, totalStock: 12 }], totalCount: 1, currentPage: 0, totalPages: 1, hasNext: false };
  let user = shelter;
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/*', async route => {
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(route.request().url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/')) return route.continue();
    if (path === '/api/v1/notes/stream') return route.fulfill({ status: 429, body: '' });
    if (path === '/api/v1/notes/notifications') return route.fulfill({ json: { data: { content: [], nextCursor: null, unreadCount: 0 } } });
    if (path === '/api/v1/users/me') return route.fulfill({ json: { code: 200, data: user } });
    if (path === '/api/v1/animals/1') return route.fulfill({ json: { code: 200, data: animal } });
    if (path === '/api/v1/products') return route.fulfill({ json: products });
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });
  const signIn = async value => {
    user = value;
    await page.goto(origin + '/terms');
    await page.evaluate(state => localStorage.setItem('auth-storage', state), JSON.stringify({ state: { user: value, accessToken: 'test-only-token', refreshToken: null }, version: 0 }));
  };
  const setDark = dark => page.evaluate(on => document.documentElement.classList.toggle('dark', on), dark);
  // transition-colors 가 있는 버튼은 모드를 바꾼 직후 중간 색이 읽히므로 기대한 색이 될 때까지 잠시 기다린다.
  const colorOf = async (locator, expected) => {
    for (let i = 0; i < 20; i++) {
      const color = await locator.evaluate(element => getComputedStyle(element).color);
      if (color === expected) return color;
      await page.waitForTimeout(50);
    }
    return locator.evaluate(element => getComputedStyle(element).color);
  };
  const light = { red500: 'rgb(239, 68, 68)', red700: 'rgb(185, 28, 28)' };
  const dangerDark = 'rgb(252, 165, 165)';

  await signIn(shelter);
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto(origin + '/animals/1/edit');
  await page.getByRole('heading', { level: 1, name: '동물 수정' }).waitFor();
  const stars = page.locator('label span', { hasText: /^\*$/ });
  assert(await stars.count() >= 4, 'edit-required-marks-found');
  for (const dark of [false, true]) {
    await setDark(dark);
    const colors = await stars.evaluateAll(elements => elements.map(element => getComputedStyle(element).color));
    const expected = dark ? dangerDark : light.red500;
    assert(colors.every(color => color === expected), `edit-required-marks-${dark ? 'dark' : 'light'}: ${colors.join(', ')}`);
  }

  await setDark(false);
  await signIn(admin);
  await page.goto(origin + '/admin/products');
  const remove = page.getByRole('button', { name: '삭제', exact: true }).first();
  await remove.waitFor();
  for (const dark of [false, true]) {
    await setDark(dark);
    const expected = dark ? dangerDark : light.red700;
    const color = await colorOf(remove, expected);
    assert(color === expected, `admin-delete-${dark ? 'dark' : 'light'}: ${color}`);
  }
  await setDark(false);

  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
