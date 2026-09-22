// Vite preview on 5210. Every API request is intercepted; no live account or data is used.
async page => {
  const origin = 'http://127.0.0.1:5210';
  const checks = [], errors = [], unexpected = [], requests = [];
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const definitions = [
    { tab: 'favoriteAnimals', title: '내가 찜한 동물', label: '찜한 동물을', empty: '아직 찜한 동물이 없습니다.', path: '/api/users/me/favorite-animals' },
    { tab: 'registeredAnimals', title: '내 보호소가 등록한 동물', label: '등록한 동물을', empty: '아직 등록한 동물이 없습니다.', path: '/api/users/me/registered-animals' },
    { tab: 'wishlist', title: '나의 위시리스트', label: '위시리스트를', empty: '찜한 상품이 없습니다.', path: '/api/v1/mypage/wishlists' },
    { tab: 'cart', title: '나의 장바구니', label: '장바구니를', empty: '장바구니가 비어있습니다.', path: '/api/carts' },
    { tab: 'orders', title: '나의 주문 목록', label: '주문 내역을', empty: '주문 내역이 없습니다.', path: '/api/orders' },
  ];
  let selected, mode = 'hold', held = [], empty = false;
  const user = () => ({ id: 10, userId: 10, name: '목록검증', nickname: '목록검증', email: 'lists@example.invalid', provider: 'LOCAL', role: selected.tab === 'registeredAnimals' ? 'ROLE_SHELTER' : 'ROLE_ADMIN', createdAt: '2026-09-01T00:00:00' });
  const animal = id => ({ id, favoriteId: id, animalId: id, userId: 10, breed: `검증 동물 ${id}`, species: 'DOG', gender: 'UNKNOWN', age: 2, status: 'PROTECT', shelterName: '검증 보호소', createdAt: '2026-09-01T00:00:00' });
  const product = id => ({ wishlistId: id, productId: id, skuId: id, skuCode: `TEST-${id}`, productName: `검증 상품 ${id}`, productStatus: 'ACTIVE', price: 1000, quantity: 1, options: {}, createdAt: '2026-09-01T00:00:00' });
  const order = id => ({ orderId: id, orderUuid: `test-order-${id}`, status: 'PAID', createdAt: '2026-09-01T00:00:00', totalAmount: 1000, receiverName: '테스트', deliveryAddress: '테스트 주소', items: [product(id)] });
  const handler = async route => {
    const req = route.request(), relative = req.url().replace(/^https?:\/\/[^/]+/, ''), path = relative.split('?')[0];
    if (!path.startsWith('/api/')) return route.continue();
    requests.push({ method: req.method(), relative });
    if (path === '/api/users/me' && req.method() === 'GET') return route.fulfill({ json: { code: 200, data: user() } });
    if (path === '/api/carts' && req.method() === 'DELETE') return route.fulfill({ json: {} });
    if (path !== selected.path || req.method() !== 'GET') {
      unexpected.push(`${req.method()} ${relative}`); return route.abort();
    }
    if (mode === 'hold') await new Promise(resolve => held.push(resolve));
    if (mode === 'fail') return route.fulfill({ status: 500, json: { message: '모의 조회 실패' } });
    const param = name => decodeURIComponent(relative.split('?')[1]?.match(new RegExp(`(?:^|&)${name}=([^&]*)`))?.[1] ?? '');
    if (selected.tab === 'favoriteAnimals') return route.fulfill({ json: { code: 200, data: { userId: 10, totalCount: empty ? 0 : 25, favorites: empty ? [] : Array.from({ length: 25 }, (_, i) => animal(i + 1)) } } });
    if (selected.tab === 'cart') return route.fulfill({ json: empty ? [] : [product(1)] });
    const size = selected.tab === 'orders' ? 10 : 20, number = Number(param('page'));
    assert(param('size') === String(size), 'Page size changed');
    if (selected.tab === 'registeredAnimals') assert(param('sort') === 'createdAt,desc', 'Registered sort changed');
    if (selected.tab === 'wishlist') assert(param('userId') === '10', 'Wishlist user changed');
    const item = selected.tab === 'orders' ? order : selected.tab === 'registeredAnimals' ? animal : product;
    const data = { content: empty ? [] : [item(number * size + 1)], totalElements: empty ? 0 : 21, totalPages: empty ? 0 : Math.ceil(21 / size), page: number, number, size };
    return route.fulfill({ json: selected.tab === 'registeredAnimals' ? { code: 200, data } : data });
  };
  const button = name => page.getByRole('button', { name, exact: true });
  const loading = () => page.getByText(`${selected.label} 불러오는 중입니다.`, { exact: true });
  const failure = () => page.getByText(`${selected.label} 불러오지 못했어요`, { exact: true });
  const listReads = () => requests.filter(r => r.method === 'GET' && r.relative.split('?')[0] === selected.path);
  const open = async () => {
    await page.evaluate(({ user, tab }) => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user, accessToken: 'mock-list-token' }, version: 0 }));
      sessionStorage.setItem('mypageActiveTab', tab);
    }, { user: user(), tab: selected.tab });
    requests.length = 0;
    await page.goto(`${origin}/mypage`);
    await page.getByRole('heading', { name: selected.title, exact: true }).waitFor();
  };
  const release = next => { mode = next; const pending = held; held = []; assert(pending.length === 1, `Expected one pending request, got ${pending.length}`); pending.forEach(resolve => resolve()); };
  const noEmpty = async () => assert(await page.getByText(selected.empty, { exact: true }).count() === 0, 'Request state was shown as an empty list');
  const layout = async () => {
    assert(await page.locator('header').count() === 1 && await page.locator('footer').count() === 1, 'Page shell missing');
    assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `${selected.tab} overflow`);
    assert(await button('person 프로필 정보').count() === 1 || await page.getByRole('button', { name: '프로필 정보' }).count() === 1, 'Sidebar missing');
  };
  const success = async (number = 0) => {
    if (empty) return page.getByText(selected.empty, { exact: true }).waitFor();
    const id = number * (selected.tab === 'orders' ? 10 : 20) + 1;
    if (['favoriteAnimals', 'registeredAnimals'].includes(selected.tab)) return page.getByRole('heading', { name: `검증 동물 ${id}`, exact: true }).waitFor();
    return page.getByText(`검증 상품 ${id}`, { exact: true }).waitFor();
  };
  const retry = async (next, number = 0) => {
    mode = 'hold'; const before = listReads().length;
    await button('다시 시도').focus();
    assert(await button('다시 시도').evaluate(el => el === document.activeElement), 'Retry is not keyboard focusable');
    await page.keyboard.press('Enter');
    const busy = button('다시 불러오는 중...'); await busy.waitFor();
    assert(await busy.isDisabled(), 'Retry not disabled');
    await busy.evaluate(el => { el.click(); el.click(); });
    // Allow browser requests to reach interception before checking deduplication.
    await page.waitForTimeout(150);
    assert(listReads().length === before + 1, 'Duplicate retry request');
    await noEmpty(); release(next);
    if (next === 'fail') { await failure().waitFor(); await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent === '다시 시도' && !b.disabled)); }
    else await success(number);
  };
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  await page.route('**/api/**', handler);
  await page.addInitScript(() => { window.confirm = () => true; });
  try {
    await page.goto(`${origin}/login`);
    for (const width of [1920, 390]) {
      await page.setViewportSize({ width, height: width === 1920 ? 1080 : 844 });
      for (const definition of definitions) {
        selected = definition; empty = false; mode = 'hold';
        await open(); await loading().waitFor(); await noEmpty(); await layout();
        await page.screenshot({ path: `/tmp/mypage-list-${selected.tab}-loading-${width}.png`, fullPage: true, animations: 'disabled' });
        release('fail'); await failure().waitFor(); await noEmpty(); await layout();
        assert(listReads().length === 2, 'Expected configured single automatic retry');
        await page.screenshot({ path: `/tmp/mypage-list-${selected.tab}-error-${width}.png`, fullPage: true, animations: 'disabled' });
        await retry('fail'); await retry('normal'); await layout();
        checks.push(`${selected.tab}: loading / error / retry failure / keyboard retry success / layout ${width}`);
        // Only a successfully fetched empty response may show the empty state.
        empty = true; mode = 'fail'; await open(); await failure().waitFor(); await noEmpty();
        await retry('normal'); await layout();
        checks.push(`${selected.tab}: retry to empty success ${width}`);
      }
      // Page and filter parameters survive request failure and manual retry.
      for (const name of ['registeredAnimals', 'wishlist', 'orders']) {
        selected = definitions.find(d => d.tab === name); empty = false; mode = 'normal'; await open(); await success();
        if (name === 'orders') {
          const response = page.waitForResponse(r => r.url().includes('status=PAID'));
          await page.locator('main select').selectOption('PAID'); await response; await success();
        }
        mode = 'fail'; await button('다음').click(); await failure().waitFor();
        const failedUrl = listReads().at(-1).relative;
        assert(failedUrl.includes('page=1'), 'Page reset before retry');
        await retry('normal', 1); assert(listReads().at(-1).relative === failedUrl, 'Retry changed request parameters');
        if (name === 'orders') assert(await page.locator('main select').inputValue() === 'PAID', 'Order filter reset');
        await page.getByRole('button', { name: '프로필 정보' }).click();
        await page.getByRole('button', { name: selected.title }).click(); await success(1);
        checks.push(`${name}: same page/filter retry and tab persistence ${width}`);
      }
      // Invalidation can fail with successful data still cached. Do not offer stale checkout actions.
      selected = definitions.find(d => d.tab === 'cart'); mode = 'normal'; empty = false;
      await open(); await success(); mode = 'fail'; await button('장바구니 비우기').click();
      await failure().waitFor();
      assert(await button('주문하기').count() === 0 && await button('장바구니 비우기').count() === 0, 'Stale cart actions exposed after refresh failure');
      empty = true; await retry('normal'); checks.push(`cached cart refresh failure and recovery ${width}`);
    }
    assert(errors.length === 0 && unexpected.length === 0, JSON.stringify({ errors, unexpected }));
    return { checks, pageErrors: errors, unexpectedRequests: unexpected };
  } catch (error) {
    console.log('Feedback test failed:', error.message, selected?.tab, checks);
    throw error;
  } finally {
    mode = 'normal'; held.forEach(resolve => resolve()); held = [];
    page.off('pageerror', onError); await page.unrouteAll({ behavior: 'wait' });
  }
}
