// Vite preview on 5207. All API calls, including mutations, are intercepted.
async page => {
  const origin = 'http://127.0.0.1:5207';
  const layouts = [], checks = [], errors = [], unexpected = [], requests = [], writes = [];
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  let role = 'ROLE_ADMIN', wishlist = [], cart = [], orders = [], failMutation = false;
  let pendingMutation = null, holdMutation = false, readMode = 'normal', pendingRead = null;
  const user = () => ({ id: 10, userId: 10, name: '검증회원', nickname: '관리자', email: 'market@example.invalid', provider: 'LOCAL', role, createdAt: '2026-09-01T00:00:00' });
  const wish = (id, status = 'ACTIVE') => ({ wishlistId: id, skuId: id + 100, skuCode: `SKU-${id}`, productId: id + 200, productName: id === 1 ? '가벼운 반려동물 이동 가방 긴 상품명 표시 확인' : `상품 ${id}`, productImageUrl: '/test-market-missing.png', productStatus: status, price: id * 1000, options: { 색상: '노랑' }, createdAt: `2026-09-${String(id).padStart(2, '0')}T00:00:00` });
  const cartItem = (price = 24999, quantity = 2) => ({ id: 1, skuId: 101, skuCode: 'SKU-1', productId: 201, productName: '검증 장바구니 상품', productImageUrl: '', price, quantity, stockQuantity: 20 });
  const order = id => ({ orderId: id, orderUuid: `order-${id}-20260921000000`, totalAmount: id * 1000, status: ['PENDING', 'PAID', 'COMPLETED', 'CANCELLED', 'FAILED'][(id - 1) % 5], receiverName: '검증 수령인', receiverPhone: '01000000000', deliveryAddress: '검증용 주소', createdAt: '2026-09-21T00:00:00', items: [{ productName: `주문상품 ${id}`, skuCode: `SKU-${id}`, price: id * 1000, quantity: 1 }] });
  const seed = () => { wishlist = [wish(1), wish(2, 'SOLD_OUT'), wish(3)]; cart = [cartItem()]; orders = Array.from({ length: 21 }, (_, i) => order(i + 1)); };
  const paged = (items, number, size) => ({ content: items.slice(number * size, (number + 1) * size), page: number, number, size, totalElements: items.length, totalPages: Math.ceil(items.length / size) });
  const handler = async route => {
    const request = route.request(), relative = request.url().replace(/^https?:\/\/[^/]+/, ''), path = relative.split('?')[0];
    const query = relative.split('?')[1] ?? '';
    const param = name => decodeURIComponent(query.match(new RegExp(`(?:^|&)${name}=([^&]*)`))?.[1] ?? '');
    requests.push(`${request.method()} ${relative}`);
    if (request.method() === 'GET') {
      if (path === '/api/users/me') return route.fulfill({ json: { code: 200, data: user() } });
      if (['/api/v1/mypage/wishlists', '/api/carts', '/api/orders'].includes(path)) {
        if (readMode === 'hold') await new Promise(resolve => { pendingRead = resolve; });
        if (readMode === 'fail') return route.fulfill({ status: 500, json: { message: '검증 조회 실패' } });
        if (path.includes('wishlists')) {
          assert(param('userId') === '10' && param('size') === '20', 'Wishlist request contract');
          return route.fulfill({ json: paged(wishlist, Number(param('page')), 20) });
        }
        if (path === '/api/carts') return route.fulfill({ json: cart });
        assert(param('size') === '10', 'Orders page size');
        return route.fulfill({ json: paged(orders.filter(o => !param('status') || o.status === param('status')), Number(param('page')), 10) });
      }
      if (/^\/api\/orders\/\d+$/.test(path)) return route.fulfill({ json: { ...order(Number(path.split('/').at(-1))), deliveryStatus: 'READY' } });
    }
    if ((request.method() === 'DELETE' && (/^\/api\/wishlists\/\d+$/.test(path) || path === '/api/carts')) || (request.method() === 'POST' && path === '/api/carts/items')) {
      writes.push({ method: request.method(), path, body: request.postData() ? request.postDataJSON() : null });
      if (holdMutation) await new Promise(resolve => { pendingMutation = resolve; });
      if (failMutation) return route.fulfill({ status: 400, json: { message: '검증 변경 실패' } });
      if (path.startsWith('/api/wishlists/')) wishlist = wishlist.filter(x => x.wishlistId !== Number(path.split('/').at(-1)));
      else if (path === '/api/carts') cart = [];
      else cart = [cartItem()];
      return route.fulfill({ json: path === '/api/carts/items' ? cart : {} });
    }
    unexpected.push(`${request.method()} ${path}`);
    return route.abort();
  };
  const onError = error => errors.push(error.message);
  const tab = name => page.getByRole('button', { name, exact: false });
  const button = name => page.getByRole('button', { name, exact: true });
  const wishCards = () => page.locator('main div.group').filter({ has: page.locator('h3') });
  const names = () => wishCards().locator('h3').allTextContents();
  const alerts = () => page.evaluate(() => window.__marketAlerts);
  const confirm = value => page.evaluate(value => { window.__marketConfirm = value; }, value);
  const open = async selected => {
    await page.evaluate(({ user, selected }) => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user, accessToken: 'test-only-token' }, version: 0 }));
      sessionStorage.setItem('mypageActiveTab', selected);
    }, { user: user(), selected });
    requests.length = 0;
    await page.goto(`${origin}/mypage`);
    await tab('프로필 정보').waitFor();
  };
  const finishMutation = async () => {
    assert(pendingMutation !== null, 'Mutation did not reach handler');
    const finish = pendingMutation; pendingMutation = null; holdMutation = false; finish();
  };
  await page.addInitScript(() => {
    localStorage.setItem('pawbridge.analytics-consent.v1', 'denied');
    window.__marketAlerts = []; window.__marketConfirm = false;
    window.alert = text => window.__marketAlerts.push(text);
    window.confirm = () => window.__marketConfirm;
  });
  page.on('pageerror', onError);
  await page.route('**/api/**', handler);
  await page.route('**/test-market-missing.png', route => route.fulfill({ status: 404, body: '' }));
  try {
    await page.goto(`${origin}/login`);
    for (const width of [1920, 390]) {
      await page.setViewportSize({ width, height: width === 1920 ? 1080 : 844 });
      seed(); await open('profile');
      assert(!requests.some(x => /wishlists|carts|orders/.test(x)), 'Inactive market tab fetched');
      await tab('나의 위시리스트').click(); await wishCards().nth(2).waitFor();
      assert((await names()).join('|') === [wish(3).productName, wish(2).productName, wish(1).productName].join('|'), 'Latest order');
      const sort = page.locator('main select');
      await sort.selectOption('priceAsc'); assert((await names())[0] === wish(1).productName, 'Ascending price');
      await sort.selectOption('priceDesc'); assert((await names())[0] === wish(3).productName, 'Descending price');
      await sort.selectOption('nameAsc'); assert((await names()).join('|') === [wish(1), wish(2), wish(3)].sort((a,b)=>a.productName.localeCompare(b.productName)).map(x=>x.productName).join('|'), 'Name sort');
      await page.getByLabel('품절 상품 숨기기').check();
      await wishCards().first().locator('input[type=checkbox]').check();
      await tab('프로필 정보').click(); await tab('나의 위시리스트').click();
      assert(await sort.inputValue() === 'nameAsc' && await page.getByLabel('품절 상품 숨기기').isChecked(), 'Wishlist filters lost across tabs');
      assert(await wishCards().first().locator('input[type=checkbox]').isChecked(), 'Selection lost');
      await page.getByLabel(/전체 선택/).check();
      assert(await wishCards().count() === 2 && await page.getByLabel(/전체 선택/).isChecked(), 'Visible select all');
      await page.getByLabel(/전체 선택/).uncheck(); assert(await button('선택 삭제').isDisabled(), 'Empty selection deletion');
      await page.getByLabel('품절 상품 숨기기').uncheck(); assert(await button('block 품절').isDisabled(), 'Sold-out add enabled');
      await page.waitForFunction(() => [...document.querySelectorAll('main img')].every(i => i.complete && i.naturalWidth > 0));
      assert((await wishCards().first().locator('a').first().getAttribute('href')).startsWith('/products/'), 'Product link');
      await page.mouse.move(0,0); await page.evaluate(() => document.fonts.ready);
      layouts.push({ panel: 'wishlist', width, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
      await page.screenshot({ path: `/tmp/mypage-market-wishlist-${width}.png`, fullPage: true, animations: 'disabled' });
      wishlist = Array.from({ length: 21 }, (_, i) => wish(i + 1)); await open('wishlist');
      await button('다음').click(); await page.getByRole('heading', { name: '상품 21', exact: true }).waitFor();
      await tab('프로필 정보').click(); await tab('나의 위시리스트').click();
      assert(await button('다음').isDisabled(), 'Wishlist page persistence');
      await button('이전').click(); await button('2').click(); await button('1').click();
      checks.push(`wishlist filters, selection, pagination, image fallback / ${width}`);
      seed(); await open('cart'); await button('주문하기').waitFor();
      assert((await page.locator('main').innerText()).includes('₩52,998'), 'Cart amount with shipping');
      layouts.push({ panel: 'cart', width, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
      await page.screenshot({ path: `/tmp/mypage-market-cart-${width}.png`, fullPage: true, animations: 'disabled' });
      await button('주문하기').click(); await page.waitForURL('**/checkout');
      const state = await page.evaluate(() => history.state.usr);
      assert(state.totalProductPrice === 49998 && state.shippingFee === 3000 && state.totalPrice === 52998 && state.cartItems[0].quantity === 2, 'Checkout state');
      cart = [cartItem(25000)]; await open('cart'); await button('주문하기').waitFor();
      assert((await page.locator('main').innerText()).includes('무료'), 'Free shipping boundary');
      await button('주문하기').click(); await page.waitForURL('**/checkout');
      assert((await page.evaluate(() => history.state.usr)).totalPrice === 50000, 'Free shipping total');
      checks.push(`cart totals, shipping boundary, checkout state / ${width}`);
      seed(); await open('orders'); await button('상세 보기').first().waitFor();
      layouts.push({ panel: 'orders', width, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
      await page.screenshot({ path: `/tmp/mypage-market-orders-${width}.png`, fullPage: true, animations: 'disabled' });
      await button('다음').click(); await page.getByRole('heading', { name: '주문상품 11', exact: true }).waitFor();
      await tab('프로필 정보').click(); await tab('나의 주문 목록').click();
      assert(await page.getByRole('heading', { name: '주문상품 11', exact: true }).count() === 1, 'Orders page persistence');
      await button('3').click(); await page.getByRole('heading', { name: '주문상품 21', exact: true }).waitFor();
      await button('이전').click(); await page.locator('main select').selectOption('PAID');
      await page.getByRole('heading', { name: '주문상품 2', exact: true }).waitFor();
      assert(requests.some(x => x.includes('status=PAID') && x.includes('page=0')), 'Filter did not reset page');
      await tab('프로필 정보').click(); await tab('나의 주문 목록').click();
      assert(await page.locator('main select').inputValue() === 'PAID', 'Order filter lost');
      await button('상세 보기').first().click(); await page.waitForURL('**/orders/2');
      checks.push(`orders filter, pagination, persistence, detail / ${width}`);
      for (const selected of ['wishlist','cart','orders']) {
        wishlist=[]; cart=[]; orders=[]; await open(selected);
        const text = selected === 'wishlist' ? '찜한 상품이 없습니다.' : selected === 'cart' ? '장바구니가 비어있습니다.' : '주문 내역이 없습니다.';
        await page.getByText(text, { exact: true }).waitFor();
        assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `Empty ${selected} overflow`);
      }
    }
    // Confirm/cancel, failure and pending behavior use intercepted mutations only.
    seed(); await open('wishlist'); await wishCards().nth(2).waitFor();
    const before = writes.length;
    await wishCards().first().getByTitle('삭제', { exact: true }).click();
    assert(writes.length === before, 'Cancelled removal wrote');
    await confirm(true); holdMutation=true; failMutation=true;
    await wishCards().first().getByTitle('삭제', { exact: true }).click();
    await page.waitForFunction(() => [...document.querySelectorAll('button[title="삭제"]')].every(b=>b.disabled));
    await finishMutation(); await page.waitForFunction(() => window.__marketAlerts.includes('삭제에 실패했습니다.'));
    assert(await wishCards().count() === 3, 'Failed deletion lost item');
    failMutation=false; await wishCards().first().getByTitle('삭제', { exact: true }).click();
    await page.waitForFunction(() => window.__marketAlerts.includes('찜 목록에서 삭제되었습니다.'));
    await page.getByLabel(/전체 선택/).check();
    await button('선택 삭제').click();
    await page.getByText('찜한 상품이 없습니다.', { exact: true }).waitFor();
    assert((await alerts()).includes('선택한 상품이 삭제되었습니다.'), 'Bulk deletion feedback');
    seed(); await open('wishlist'); await wishCards().nth(2).waitFor(); await confirm(true);
    holdMutation=true; failMutation=true;
    await tab('담기').first().click(); await page.waitForFunction(() => [...document.querySelectorAll('main button')].filter(b=>b.innerText.includes('담기')).every(b=>b.disabled));
    assert(JSON.stringify(writes.at(-1).body) === JSON.stringify({ skuId: 103, quantity: 1 }), 'Add payload');
    await finishMutation(); await page.waitForFunction(() => window.__marketAlerts.includes('장바구니 추가에 실패했습니다.'));
    failMutation=false; await tab('담기').first().click(); await page.getByRole('heading', { name: '나의 장바구니', exact: true }).waitFor();
    await button('주문하기').waitFor();
    await confirm(false); const clearBefore=writes.length; await button('장바구니 비우기').click(); assert(writes.length===clearBefore, 'Cancelled cart clear wrote');
    await confirm(true); holdMutation=true; failMutation=true; await button('장바구니 비우기').click();
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b=>b.innerText==='장바구니 비우기' && b.disabled));
    await finishMutation();
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b=>b.innerText==='장바구니 비우기' && !b.disabled));
    assert(await button('주문하기').count()===1, 'Failed clear lost cart');
    failMutation=false; await button('장바구니 비우기').click(); await page.getByText('장바구니가 비어있습니다.', { exact:true }).waitFor();
    checks.push('mutation cancel, pending, payload, success, failure and refetch');
    for (const selected of ['wishlist','cart','orders']) {
      seed(); readMode='hold'; pendingRead=null; await open(selected);
      const empty=selected==='wishlist'?'찜한 상품이 없습니다.':selected==='cart'?'장바구니가 비어있습니다.':'주문 내역이 없습니다.';
      await page.getByText(empty,{exact:true}).waitFor();
      assert(pendingRead!==null, 'Read not intercepted'); readMode='normal'; pendingRead();
      if(selected==='wishlist') await wishCards().nth(2).waitFor();
      else if(selected==='cart') await button('주문하기').waitFor();
      else await button('상세 보기').first().waitFor();
      readMode='fail'; await open(selected); await page.getByText(empty,{exact:true}).waitFor();
      await page.waitForTimeout(1400); assert(await page.getByText(empty,{exact:true}).count()===1, 'Failure baseline changed');
    }
    readMode='normal'; role='ROLE_USER';
    for (const selected of ['wishlist','cart','orders']) {
      await open(selected);
      assert(await tab('나의 위시리스트').count()===0 && !requests.some(x=>/wishlists|carts|orders/.test(x)), 'Non-admin market access');
    }
    checks.push('empty/loading/error baseline and role/request restrictions');
    assert(errors.length===0 && unexpected.length===0, JSON.stringify({errors,unexpected}));
    return {checks, layouts, mutations:writes.length, pageErrors:errors, unexpectedRequests:unexpected};
  } finally {
    page.off('pageerror',onError); await page.unroute('**/api/**',handler); await page.unroute('**/test-market-missing.png');
  }
}
