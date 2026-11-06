// 모의 데이터로 주문 내역이 390에서는 카드, 1920에서는 표로 보이는지 본다.
// 390에서 표가 가로로 넘치면 금액, 상태, 상세 보기가 화면 밖으로 밀려 보이지 않던 문제를 막는다.
async page => {
  const origin = 'http://127.0.0.1:5274';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  const user = { id: 98, userId: 98, name: '검수보호소', nickname: '검수보호소', email: 'shelter@example.invalid', provider: 'LOCAL', role: 'ROLE_SHELTER', careRegNo: '311000000001', createdAt: '2026-09-01T00:00:00' };
  const order = (orderId, status) => ({ orderId, orderUuid: `00000000-0000-0000-0000-00000000000${orderId}`, totalAmount: 19000 * orderId, status, receiverName: '검수', receiverPhone: '010-0000-0000', deliveryAddress: '서울시 검수구', createdAt: '2026-11-01T10:00:00', items: [{ productName: '산책 하네스', skuCode: 'SKU-1', price: 19000, quantity: orderId }] });
  const orders = { content: [order(1, 'PENDING'), order(2, 'PAID'), order(3, 'COMPLETED'), order(4, 'CANCELLED')], totalElements: 4, totalPages: 1, number: 0, size: 10 };
  const labels = ['주문 대기', '결제 완료', '주문 완료', '주문 취소'];
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
    if (path === '/api/v1/orders') return route.fulfill({ json: orders });
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });
  await page.goto(origin + '/terms');
  await page.evaluate(state => localStorage.setItem('auth-storage', state), JSON.stringify({ state: { user, accessToken: 'test-only-token', refreshToken: null }, version: 0 }));
  // 요소가 화면 가로 안에 온전히 들어와 있는지 본다(가로 스크롤 없이 보여야 한다).
  const inViewport = locator => locator.evaluate(element => { const box = element.getBoundingClientRect(); return box.width > 0 && box.left >= 0 && box.right <= window.innerWidth; });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + '/orders');
  const main = page.locator('main');
  // 필터 select의 option에도 같은 글자가 있으므로 칩(span)으로 기다린다.
  await main.locator('span.rounded-full', { hasText: '주문 대기' }).first().waitFor();
  const cards = main.locator('li').filter({ has: page.getByRole('button', { name: '상세 보기' }) });
  assert(await cards.count() === 4, 'mobile-four-cards: ' + await cards.count());
  for (let index = 0; index < 4; index++) {
    const card = cards.nth(index);
    for (const [name, target] of [
      ['status', card.getByText(labels[index], { exact: true })],
      ['amount', card.getByText(`${new Intl.NumberFormat('ko-KR').format(19000 * (index + 1))}원`, { exact: true })],
      ['detail', card.getByRole('button', { name: '상세 보기' })],
    ]) {
      assert(await target.isVisible() && await inViewport(target), `mobile-${labels[index]}-${name}-visible`);
    }
  }
  assert(!await main.locator('table').isVisible(), 'mobile-table-hidden');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 0, 'mobile-no-horizontal-scroll: ' + overflow);
  await cards.first().getByRole('button', { name: '상세 보기' }).click();
  await page.waitForURL(url => url.pathname === '/orders/1');
  assert(true, 'mobile-detail-navigates');

  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto(origin + '/orders');
  await main.locator('table').waitFor();
  assert(await main.locator('tbody tr').count() === 4, 'desktop-four-rows');
  assert(!await cards.first().isVisible(), 'desktop-cards-hidden');
  for (const label of labels) assert(await inViewport(main.locator('table').getByText(label, { exact: true })), `desktop-${label}-visible`);

  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
