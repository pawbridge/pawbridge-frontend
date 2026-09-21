// Production preview on 5209. All API requests are intercepted; no real accounts.
async page => {
  const origin = 'http://127.0.0.1:5209';
  const results = [], requests = [], unexpected = [], errors = [];
  let role = 'ROLE_USER';
  let held = null, holdRead = null, failRead = null, failLogout = false, holdLogout = false;
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
    if (path === '/api/auth/logout' && r.method() === 'POST') {
      if (holdLogout) await new Promise(resolve => { held = resolve; });
      return route.fulfill({ status: failLogout ? 500 : 200, json: { code: failLogout ? 500 : 200 } });
    }
    if (r.method() === 'GET') {
      if (holdRead?.id === id && holdRead.path === path) {
        await new Promise(resolve => { held = resolve; });
        held = null;
      }
      if (failRead?.id === id && failRead.path === path) return route.fulfill({ status: failRead.status, json: { message: '모의 오류' } });
      if (path === '/api/animals/303') return send(animal(303));
      if (path === '/api/animals/303/similar') return send([]);
      if (path === '/api/favorites/303/check') return send({ code: 200, data: id === 101 });
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
    window.alert = () => {}; window.__allowLogout = true; window.confirm = () => window.__allowLogout;
    window.__documentMarker = Math.random();
  });
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/**', handler);

  const waitHeld = async () => {
    for (let i = 0; i < 100 && !held; i++) await page.waitForTimeout(20);
    assert(held !== null, 'Held request not reached');
  };
  const release = () => { assert(held, 'No held request'); holdRead = null; held(); };
  const reset = async (nextRole = 'ROLE_USER') => {
    role = nextRole; held = null; holdRead = null; failRead = null; failLogout = false; holdLogout = false;
    await page.goto(`${origin}/login`);
    await page.evaluate(() => { localStorage.removeItem('auth-storage'); sessionStorage.clear(); });
    await page.reload(); requests.length = 0;
  };
  const logout = async () => {
    await page.locator('header').getByRole('button', { name: '로그아웃' }).first().click();
    await page.waitForURL(`${origin}/`);
    await navigate('/login');
  };
  const startWatching = async () => page.evaluate(() => {
    window.__oldAccountRendered = false;
    window.__accountObserver = new MutationObserver(() => {
      if (document.body.textContent.includes('계정101전용')) window.__oldAccountRendered = true;
    });
    window.__accountObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  const noOldData = async () => {
    assert(!await page.evaluate(() => window.__oldAccountRendered || document.body.textContent.includes('계정101전용')), 'Previous account data rendered');
  };
  try {
    await page.setViewportSize({ width: 1920, height: 1080 });
    // Independent routes share the same user-scoped entries as MyPage.
    for (const c of [
      { role: 'ROLE_USER', path: '/favorite-animals', tab: '내가 찜한 동물', text: '전용동물', api: '/api/users/me/favorite-animals' },
      { role: 'ROLE_SHELTER', path: '/registered-animals', tab: '내 보호소가 등록한 동물', text: '전용동물', api: '/api/users/me/registered-animals' },
      { role: 'ROLE_ADMIN', path: '/cart', tab: '나의 장바구니', text: '전용상품', api: '/api/carts' },
    ]) {
      await reset(c.role); await login(101);
      await page.getByRole('button', { name: c.tab }).click();
      await page.getByText(`계정101${c.text}`, { exact: true }).waitFor();
      await navigate(c.path);
      await page.getByText(`계정101${c.text}`, { exact: true }).waitFor();
      assert(requests.filter(r => r.path === c.api && r.id === 101).length === 1, 'Same account did not reuse cache');
      await logout(); await startWatching(); await login(202); await navigate(c.path);
      await page.getByText(`계정202${c.text}`, { exact: true }).waitFor();
      await noOldData();
      assert(requests.filter(r => r.path === c.api && r.id === 202).length === 1, 'New account did not fetch');
      results.push(`independent route and same-account cache: ${c.path}`);
    }
    // Animal detail's favorite boolean must also be account-scoped.
    await reset(); await login(101); await navigate('/animals/303');
    await page.getByTitle('찜 해제', { exact: true }).waitFor();
    await logout(); await login(202); await navigate('/animals/303');
    await page.getByTitle('찜하기', { exact: true }).waitFor();
    assert(requests.filter(r => r.path === '/api/favorites/303/check' && r.id === 202).length === 1, 'Favorite status reused');
    results.push('animal detail favorite belongs to B');

    // B's slow/failed read must never fall back to A's cached list, even transiently.
    for (const mode of ['slow', 'failure']) {
      await reset(); await login(101);
      await page.getByRole('button', { name: '내가 찜한 동물' }).click();
      await page.getByText('계정101전용동물', { exact: true }).waitFor();
      await page.evaluate(() => { window.__allowLogout = false; });
      await page.locator('aside').getByRole('button', { name: '로그아웃' }).click();
      assert(await page.getByText('계정101전용동물', { exact: true }).count() === 1, 'Cancelled logout removed account');
      await page.evaluate(() => { window.__allowLogout = true; });
      await page.locator('aside').getByRole('button', { name: '로그아웃' }).click();
      await page.waitForURL(`${origin}/login`);
      holdRead = { path: '/api/users/me/favorite-animals', id: 202 };
      if (mode === 'failure') failRead = { ...holdRead, status: 500 };
      await startWatching(); await login(202);
      await page.getByRole('button', { name: '내가 찜한 동물' }).click();
      await waitHeld(); await noOldData(); release();
      if (mode === 'slow') await page.getByText('계정202전용동물', { exact: true }).waitFor();
      else {
        for (let i = 0; i < 150 && requests.filter(r => r.path === '/api/users/me/favorite-animals' && r.id === 202).length < 2; i++) await page.waitForTimeout(20);
        assert(requests.filter(r => r.path === '/api/users/me/favorite-animals' && r.id === 202).length === 2, 'Failure retry not exercised');
        await page.waitForTimeout(100);
      }
      await noOldData(); results.push(`cancelled logout and B ${mode}`);
    }
    // Wishlist has no transport cancellation: its old response still reaches the Axios interceptor.
    for (const status of [200, 401]) {
      await reset('ROLE_ADMIN'); await login(101);
      holdRead = { path: '/api/v1/mypage/wishlists', id: 101 };
      if (status === 401) failRead = { ...holdRead, status };
      await page.getByRole('button', { name: '나의 위시리스트' }).click();
      await waitHeld();
      await page.locator('aside').getByRole('button', { name: '로그아웃' }).click();
      await page.waitForURL(`${origin}/login`);
      await startWatching(); await login(202);
      await page.getByRole('button', { name: '나의 위시리스트' }).click();
      await page.getByText('계정202전용찜상품', { exact: true }).waitFor();
      const marker = await page.evaluate(() => window.__documentMarker);
      const response = page.waitForResponse(r => r.url().includes('/api/v1/mypage/wishlists') && r.status() === status);
      release(); await response; await page.waitForTimeout(200);
      assert(await page.evaluate(() => JSON.parse(localStorage.getItem('auth-storage')).state.user?.id) === 202, 'Old response signed B out');
      assert(marker === await page.evaluate(() => window.__documentMarker), 'Old 401 navigated document');
      await noOldData(); results.push(`late A response ${status} ignored`);
    }
    // signal-aware A query is cancelled by logout, not reused by B.
    await reset(); await login(101);
    holdRead = { path: '/api/users/me/favorite-animals', id: 101 };
    let cancelled = false;
    const onFailed = r => { if (r.url().includes('/api/users/me/favorite-animals')) cancelled = true; };
    page.on('requestfailed', onFailed);
    await page.getByRole('button', { name: '내가 찜한 동물' }).click(); await waitHeld();
    await page.locator('aside').getByRole('button', { name: '로그아웃' }).click();
    await page.waitForURL(`${origin}/login`);
    await startWatching(); await login(202);
    await page.getByRole('button', { name: '내가 찜한 동물' }).click();
    await page.getByText('계정202전용동물', { exact: true }).waitFor();
    release(); await page.waitForTimeout(100); await noOldData();
    page.off('requestfailed', onFailed);
    assert(cancelled, 'Old signal-aware HTTP request was not aborted');
    results.push('logout aborts previous account HTTP read');

    // A delayed header logout completion must not clear B's newer session.
    await reset(); await login(101); holdLogout = true;
    await page.locator('header').getByRole('button', { name: '로그아웃' }).first().click(); await waitHeld();
    await navigate('/login'); await login(202);
    const logoutResponse = page.waitForResponse(r => r.url().includes('/api/auth/logout'));
    holdLogout = false; release(); await logoutResponse; await page.waitForTimeout(100);
    assert(await page.evaluate(() => JSON.parse(localStorage.getItem('auth-storage')).state.user?.id) === 202, 'Old logout cleared new account');
    assert(page.url() === `${origin}/mypage`, 'Old logout navigated new account');
    results.push('late header logout preserves newer session');

    // A failed server logout must still clear local auth and cache.
    await reset(); await login(101);
    await page.getByRole('button', { name: '내가 찜한 동물' }).click();
    await page.getByText('계정101전용동물', { exact: true }).waitFor();
    failLogout = true; await logout(); await startWatching(); await login(202);
    await page.getByRole('button', { name: '내가 찜한 동물' }).click();
    await page.getByText('계정202전용동물', { exact: true }).waitFor();
    await noOldData(); results.push('failed logout still removes local cache');
    assert(errors.length === 0, `Browser errors: ${errors.join(', ')}`);
    assert(unexpected.length === 0, `Unexpected API: ${unexpected.join(', ')}`);
    return { results, errors, unexpected };
  } finally { if (held) { holdRead = null; held(); } await page.unroute('**/api/**', handler); }
}
