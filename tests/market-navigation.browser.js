// Run with Playwright CLI against a local Vite server on port 5198.
// All API requests are intercepted; no live authentication or writes are used.
async page => {
  await page.unroute('**/api/**');
  const origin = 'http://127.0.0.1:5198';
  const errors = [];
  const requests = [];
  const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true, empty: true };
  let user = null;
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = request.url().replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    if (!path.startsWith('/api/')) return route.continue();
    requests.push(path);
    if (request.method() !== 'GET') throw new Error(`Unexpected mutation: ${path}`);
    let body = [];
    if (path === '/api/users/me') body = { code: 200, data: user };
    else if (path === '/api/animals' || path.includes('wishlists') || path.includes('orders')) body = emptyPage;
    else if (path.endsWith('/stats/today')) body = { rescuedToday: 0 };
    else if (path === '/api/places/regions') body = { items: [] };
    else if (path.includes('/posts')) body = { code: 200, data: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const setRole = async role => {
    user = role ? { id: 10, userId: 10, name: '테스트회원', nickname: '테스트회원', email: 'member@example.invalid', provider: 'LOCAL', createdAt: '2026-09-01T10:00:00', role } : null;
    await page.evaluate(user => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user, accessToken: user ? 'test-only-token' : null }, version: 0 }));
      sessionStorage.clear();
    }, user);
  };
  const assertHeader = async admin => {
    const links = await page.locator('header a:visible').evaluateAll(items => items.map(item => item.getAttribute('href')));
    if (links.indexOf('/travel') < 0 || links.indexOf('/adoption') !== links.indexOf('/travel') + 1) throw new Error('Travel must immediately precede adoption');
    if (links.includes('/products') !== admin || links.includes('/wishlist') !== admin) throw new Error('Wrong market header visibility');
  };
  const assertMarketTabs = async admin => {
    for (const label of ['나의 위시리스트', '나의 장바구니', '나의 주문 목록']) {
      if (await page.getByRole('button', { name: label }).count() !== (admin ? 1 : 0)) throw new Error(`Wrong tab visibility: ${label}`);
    }
  };
  await page.goto(`${origin}/login`);
  const results = [];
  for (const role of [null, 'ROLE_USER', 'ROLE_SHELTER', 'ROLE_ADMIN']) {
    const admin = role === 'ROLE_ADMIN';
    await setRole(role);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin);
    await page.getByRole('navigation', { name: '더 둘러보기' }).waitFor();
    await assertHeader(admin);
    if (await page.locator('main a[href="/products"]').count() !== (admin ? 1 : 0)) throw new Error('Wrong home market shortcut visibility');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: '메뉴 열기' }).click();
    await assertHeader(admin);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile horizontal overflow');
    if (role === 'ROLE_USER') await page.screenshot({ path: '/tmp/pawbridge-header-member-mobile.png' });
    await page.locator('header a[href="/travel"]:visible').click();
    await page.getByRole('button', { name: '메뉴 열기' }).waitFor();
    if (!page.url().endsWith('/travel')) throw new Error('Travel navigation failed');
    if (role) {
      for (const tab of ['wishlist', 'cart', 'orders']) {
        await page.evaluate(tab => sessionStorage.setItem('mypageActiveTab', tab), tab);
        requests.length = 0;
        await page.goto(`${origin}/mypage`);
        await page.getByRole('button', { name: '프로필 정보' }).waitFor();
        await assertMarketTabs(admin);
        if (!admin) {
          await page.getByRole('heading', { name: '프로필 정보', exact: true }).waitFor();
          if (requests.some(path => /wishlists|cart|orders/.test(path))) throw new Error('Hidden saved tab fetched market data');
        } else {
          const expected = tab === 'wishlist' ? 'wishlists' : tab;
          if (!requests.some(path => path.includes(expected))) throw new Error(`Admin saved tab did not fetch ${tab}`);
        }
      }
    }
    results.push(role ?? 'GUEST');
  }
  page.off('pageerror', onError);
  await page.unroute('**/api/**');
  if (errors.length) throw new Error(errors.join('\n'));
  return { rolesPassed: results, checks: ['desktop/mobile menu order', 'market and wishlist visibility', 'home shortcut', 'saved tab restore and request gating', 'mobile travel navigation', 'mobile overflow'], pageErrors: errors };
}
