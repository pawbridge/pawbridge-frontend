// Production preview on 5209. All API requests are intercepted; no real accounts.
async page => {
  const origin = 'http://127.0.0.1:5209';
  const results = [], requests = [], unexpected = [], errors = [];
  let role = 'ROLE_USER';
  const user = id => ({ id, userId: id, name: `회원${id}`, nickname: `회원${id}`, email: `member${id}@example.invalid`, role, provider: 'LOCAL', careRegNo: `shelter-${id}` });
  const animal = id => ({ id, animalId: id, favoriteId: id, breed: `계정${id}전용동물`, species: 'DOG', gender: 'UNKNOWN', age: 2, status: 'PROTECT', shelterName: '모의 보호소', images: [], favoriteCount: 0 });
  const paged = content => ({ content, page: 0, number: 0, size: 20, totalElements: content.length, totalPages: 1 });
  const handler = async route => {
    const r = route.request(), path = r.url().replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    const id = Number(r.headers()['x-user-id'] || 0);
    requests.push({ method: r.method(), path, id });
    const send = json => route.fulfill({ json });
    if (path === '/api/auth/login' && r.method() === 'POST') {
      const account = r.postDataJSON().email.includes('101') ? 101 : 202;
      return send({ code: 200, data: { ...user(account), accessToken: `mock-${account}`, refreshToken: `mock-refresh-${account}` } });
    }
    if (path === '/api/auth/logout' && r.method() === 'POST') return send({ code: 200 });
    if (r.method() === 'GET') {
      if (path === '/api/users/me') return send({ code: 200, data: user(id) });
      if (path === '/api/users/me/favorite-animals') return send({ code: 200, data: { userId: id, totalCount: 1, favorites: [animal(id)] } });
      if (path === '/api/users/me/registered-animals') return send({ code: 200, data: paged([animal(id)]) });
      if (path === '/api/carts') return send([{ id, skuId: id, skuCode: `SKU-${id}`, productId: id, productName: `계정${id}전용상품`, productImageUrl: '', price: 1000, quantity: 1, stockQuantity: 10 }]);
      if (path === '/api/v1/mypage/wishlists') return send(paged([{ wishlistId: id, skuId: id, productId: id, productName: `계정${id}전용찜상품`, productStatus: 'ACTIVE', price: 1000, options: {}, createdAt: '2026-09-21T00:00:00' }]));
      if (path === '/api/animals') return send(paged([]));
      if (path === '/api/posts/read') return send({ code: 200, data: [] });
      if (path === '/api/v1/animals/stats/today') return send({ rescueCount: 0, adoptionCount: 0 });
      if (path === '/api/v1/animals/stats/status') return send([]);
    }
    unexpected.push(`${r.method()} ${path}`);
    return route.abort();
  };
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const navigate = async path => {
    await page.evaluate(path => { history.pushState({}, '', path); dispatchEvent(new PopStateEvent('popstate')); }, path);
    await page.waitForURL(`${origin}${path}`);
  };
  const login = async id => {
    await page.getByPlaceholder('이메일 주소를 입력하세요').fill(`member${id}@example.invalid`);
    await page.getByPlaceholder('비밀번호를 입력하세요').fill('mock-password-only');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await page.waitForURL(`${origin}/`);
    assert(await page.evaluate(id => JSON.parse(localStorage.getItem('auth-storage')).state.user.id === id, id), 'Wrong signed-in account');
    await navigate('/mypage');
    await page.locator('aside').getByText(`member${id}@example.invalid`, { exact: true }).waitFor();
  };
  await page.addInitScript(() => {
    localStorage.setItem('pawbridge.analytics-consent.v1', 'denied');
    window.alert = () => {}; window.confirm = () => true;
    window.__documentMarker = Math.random();
  });
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/**', handler);
  const cases = [
    { tab: '내가 찜한 동물', role: 'ROLE_USER', text: '전용동물', path: '/api/users/me/favorite-animals' },
    { tab: '내 보호소가 등록한 동물', role: 'ROLE_SHELTER', text: '전용동물', path: '/api/users/me/registered-animals' },
    { tab: '나의 장바구니', role: 'ROLE_ADMIN', text: '전용상품', path: '/api/carts' },
    { tab: '나의 위시리스트', role: 'ROLE_ADMIN', text: '전용찜상품', path: '/api/v1/mypage/wishlists' },
  ];
  try {
    for (const width of [1920, 390]) for (const logoutPath of ['sidebar', 'header']) for (const c of cases) {
      role = c.role;
      await page.goto(`${origin}/login`);
      await page.evaluate(() => { localStorage.removeItem('auth-storage'); sessionStorage.clear(); });
      await page.reload();
      await page.setViewportSize({ width, height: 1080 });
      requests.length = 0;
      const marker = await page.evaluate(() => window.__documentMarker);
      await login(101);
      await page.getByRole('button', { name: c.tab, exact: false }).click();
      await page.getByText(`계정101${c.text}`, { exact: true }).waitFor();
      const aRequests = requests.filter(r => r.path === c.path && r.id === 101).length;
      if (logoutPath === 'sidebar') await page.locator('aside').getByRole('button', { name: '로그아웃' }).click();
      else {
        await page.locator('header').getByRole('button', { name: '로그아웃' }).first().click();
        await page.waitForURL(`${origin}/`);
        await navigate('/login');
      }
      await page.waitForURL(`${origin}/login`);
      await login(202);
      await page.getByRole('button', { name: c.tab, exact: false }).click();
      // Allow a potential request/render, then record both the account and displayed data.
      await page.waitForTimeout(400);
      const oldDataVisible = await page.getByText(`계정101${c.text}`, { exact: true }).count() > 0;
      const ownDataVisible = await page.getByText(`계정202${c.text}`, { exact: true }).count() > 0;
      const bRequests = requests.filter(r => r.path === c.path && r.id === 202).length;
      assert(marker === await page.evaluate(() => window.__documentMarker), 'Unexpected full reload invalidated cache experiment');
      assert(!oldDataVisible && ownDataVisible && bRequests === 1, `Account isolation failed: ${c.tab}/${width}/${logoutPath}`);
      results.push({ width, logoutPath, tab: c.tab, aRequests, bRequests, oldDataVisible, ownDataVisible });
      await page.evaluate(results => { sessionStorage.setItem('cache-audit-results', JSON.stringify(results)); }, results);
      if (width === 1920 && logoutPath === 'sidebar') await page.screenshot({ path: `/tmp/paw-cache-fixed-${c.path.split('/').at(-1)}.png`, fullPage: true });
    }
    assert(errors.length === 0, `Browser errors: ${errors.join(', ')}`);
    assert(unexpected.length === 0, `Unexpected API: ${unexpected.join(', ')}`);
    return { results, errors, unexpected };
  } finally {
    await page.unroute('**/api/**', handler);
  }
}
