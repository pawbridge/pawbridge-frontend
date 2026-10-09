// Browser interaction regression only. Every API, payment SDK and address lookup is synthetic.
async page => {
  const origin = 'http://127.0.0.1:5202';
  const checks = [], pageErrors = [], writes = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  let errorMode = 'message', sdkModules = 0;
  const post = { id: 12, postId: 12, title: '기존 제목', content: '기존 내용', boardType: 'ADOPTION', authorId: 7, authorName: '로컬 회원', imageUrls: [], createdAt: '2026-10-07T00:00:00Z', viewCount: 0 };
  const product = { productId: 1, name: '로컬 옵션 검증 상품', description: '합성 상품', imageUrl: origin + '/favicon-96.png', status: 'ACTIVE', skus: [
    { skuId: 11, skuCode: 'LOCAL-S', options: { 크기: 'S' }, price: 10000, stockQuantity: 10, optionValueIds: [] },
    { skuId: 12, skuCode: 'LOCAL-L', options: { 크기: 'L' }, price: 20000, stockQuantity: 10, optionValueIds: [] },
  ] };
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('dialog', dialog => dialog.dismiss());
  await page.addInitScript(() => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: { id: 7, name: '로컬 회원', role: 'ROLE_ADMIN', email: 'lint@example.invalid' }, accessToken: 'synthetic-local-token', refreshToken: null }, version: 0 }));
    window.daum = { Postcode: class {
      constructor(config) { this.config = config; }
      open() { this.config.oncomplete({ roadAddress: '로컬 검증 주소', jibunAddress: '', buildingName: '' }); }
    } };
    window.__lintPaymentError = { code: 'USER_CANCEL' };
  });
  await page.route('**/*', async route => {
    const request = route.request();
    // CLI's run-code sandbox does not expose Node's URL global.
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(request.url());
    if (!parts) return route.abort('blockedbyclient');
    const url = { href: request.url(), hostname: parts[1], pathname: parts[2] || '/' };
    if (url.href.includes('tosspayments') && request.resourceType() === 'script') {
      sdkModules++;
      return route.fulfill({ contentType: 'text/javascript', body: 'export async function loadTossPayments() { return { requestPayment: async () => { throw window.__lintPaymentError; } }; }' });
    }
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort('blockedbyclient');
    if (!url.pathname.startsWith('/api/') || !['xhr', 'fetch'].includes(request.resourceType())) return route.continue();
    const headers = { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'authorization,content-type,x-user-id', 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS' };
    const respond = data => route.fulfill({ headers, json: { code: 200, data, message: '' } });
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 200, headers });
    if (url.pathname === '/api/products/1') return route.fulfill({ headers, json: product });
    if (url.pathname === '/api/orders/direct') {
      writes.push({ path: url.pathname, data: request.postDataJSON() });
      return route.fulfill({ headers, json: { orderId: 15, orderUuid: 'synthetic-local-order', totalAmount: 43000 } });
    }
    if ((url.pathname === '/api/posts' && request.method() === 'POST') || (url.pathname === '/api/posts/12' && request.method() === 'PUT')) {
      writes.push({ path: url.pathname, method: request.method(), body: request.postData() });
      if (errorMode === 'network') return route.abort('connectionreset');
      if (errorMode === 'html') return route.fulfill({ status: 500, headers, contentType: 'text/html', body: '<html>gateway unavailable</html>' });
      return route.fulfill({ status: 400, headers, json: { message: errorMode === 'message' ? '서버 검증 안내' : 123 } });
    }
    if (url.pathname === '/api/posts/read/12') return respond(post);
    if (url.pathname.includes('/notifications/stream')) return route.fulfill({ headers, body: '', contentType: 'text/event-stream' });
    if (url.pathname.includes('/notifications')) return respond({ content: [], unreadCount: 0, nextCursor: null });
    return respond([]);
  });
  async function submitError(button, message, name) {
    const dialogPromise = page.waitForEvent('dialog');
    await button.click();
    const dialog = await dialogPromise;
    assert(dialog.message() === message, name);
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 960 });
    for (const board of ['community', 'adoption']) {
      await page.goto(origin + '/' + board + '/new' + (board === 'community' ? '?boardType=COMMUNICATION' : ''));
      const title = page.getByRole('textbox').first();
      await title.fill('로컬 작성 제목');
      await page.locator('textarea').first().fill('로컬 작성 내용');
      const button = page.getByRole('button', { name: '등록', exact: true });
      for (const mode of ['message', 'html', 'invalid', 'network']) {
        errorMode = mode;
        await submitError(button, mode === 'message' ? '서버 검증 안내' : (board === 'community' ? '게시글 작성에 실패했습니다.' : '입양후기 작성에 실패했습니다.'), board + '-create-' + mode + '-' + width);
      }
      assert(await title.inputValue() === '로컬 작성 제목', board + '-create-keeps-draft-' + width);
      const last = writes.at(-1);
      assert(last.method === 'POST' && last.body.includes('name="title"') && last.body.includes('name="boardType"'), board + '-multipart-contract-' + width);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), board + '-create-no-overflow-' + width);
      await page.goto(origin + '/' + board + '/12/edit');
      await page.getByRole('textbox').first().fill('로컬 수정 제목');
      const save = page.getByRole('button', { name: '수정완료', exact: true });
      errorMode = 'message';
      await submitError(save, '서버 검증 안내', board + '-edit-message-' + width);
      errorMode = 'html';
      await submitError(save, board === 'community' ? '게시글 수정에 실패했습니다.' : '입양후기 수정에 실패했습니다.', board + '-edit-fallback-' + width);
      assert(await page.getByRole('textbox').first().inputValue() === '로컬 수정 제목', board + '-edit-keeps-draft-' + width);
    }
    await page.goto(origin + '/products/1');
    await page.locator('p').filter({ hasText: /^S$/ }).waitFor();
    assert(await page.getByRole('button', { name: '바로 구매', exact: true }).isEnabled(), 'first-sku-selected-' + width);
    await page.getByRole('button', { name: 'L', exact: true }).click();
    await page.locator('p').filter({ hasText: /^L$/ }).waitFor();
    assert(await page.getByText('₩20,000', { exact: true }).count() === 1, 'option-updates-price-' + width);
    await page.getByRole('button', { name: '+', exact: true }).click();
    await page.getByText('₩40,000', { exact: true }).waitFor();
    await page.evaluate(async () => {
      const { queryClient } = await import('/src/lib/queryClient.ts');
      await queryClient.invalidateQueries({ queryKey: ['product', '1'] });
    });
    assert(await page.locator('p').filter({ hasText: /^L$/ }).count() === 1, 'refetch-keeps-option-' + width);
    assert(await page.locator('input[readonly]').inputValue() === '2', 'refetch-keeps-quantity-' + width);
    await page.screenshot({ path: '/tmp/pawbridge-lint-product-' + width + '.png', fullPage: true });
    await page.getByRole('button', { name: '바로 구매', exact: true }).click();
    await page.waitForURL('**/checkout');
    await page.getByPlaceholder('이름을 입력하세요').fill('로컬 검증');
    await page.getByPlaceholder('010-0000-0000').fill('01000000000');
    await page.getByRole('button', { name: '주소 찾기', exact: true }).click();
    for (const [failure, heading, name] of [[{ code: 'USER_CANCEL' }, '결제가 취소되었습니다', 'cancel'], [null, '결제 오류', 'null'], ['synthetic failure', '결제 오류', 'primitive']]) {
      await page.evaluate(value => { window.__lintPaymentError = value; }, failure);
      await page.getByRole('button', { name: '결제하기', exact: true }).click();
      await page.getByText(heading, { exact: true }).waitFor();
      assert(true, 'payment-sdk-' + name + '-' + width);
      await page.getByRole('button', { name: '확인', exact: true }).click();
    }
    const order = writes.at(-1);
    assert(order.path === '/api/orders/direct' && order.data.skuId === 12 && order.data.quantity === 2, 'direct-order-contract-' + width);
    assert(await page.getByPlaceholder('이름을 입력하세요').inputValue() === '로컬 검증', 'payment-error-keeps-form-' + width);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'checkout-no-overflow-' + width);
    await page.screenshot({ path: '/tmp/pawbridge-lint-checkout-' + width + '.png', fullPage: true });
  }
  assert(sdkModules > 0, 'payment-sdk-is-mocked');
  assert(await page.evaluate(() => typeof window.useAuthStore === 'function'), 'dev-debug-store-retained');
  assert(pageErrors.length === 0, 'no-browser-page-errors');
  return { checks: checks.length, names: checks, pageErrors, scope: 'mock APIs and synthetic SDK; no real backend, payment, auth or production validation' };
}
