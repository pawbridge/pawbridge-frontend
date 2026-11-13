// 모의 데이터로 주문 상태 칩과 등록 동물 상태, 속성 칩이 무채색 배지인지 본다.
// 색은 오류, 마감 임박, 주 동작에만 쓰고 상태와 속성은 글자로 구분한다.
// 무채색 배지는 PawBridge Blue v1의 badge/info 값(라이트 #F5F5F5 바탕에 #30302E, 다크 #262626 바탕에 #E7E5E4)이다.
async page => {
  const origin = 'http://127.0.0.1:5274';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  const user = { id: 98, userId: 98, name: '검수보호소', nickname: '검수보호소', email: 'shelter@example.invalid', provider: 'LOCAL', role: 'ROLE_SHELTER', careRegNo: '311000000001', createdAt: '2026-09-01T00:00:00' };
  const order = (orderId, status) => ({ orderId, orderUuid: `00000000-0000-0000-0000-00000000000${orderId}`, totalAmount: 19000, status, receiverName: '검수', receiverPhone: '010-0000-0000', deliveryAddress: '서울시 검수구', createdAt: '2026-11-01T10:00:00', items: [{ productName: '산책 하네스', skuCode: 'SKU-1', price: 19000, quantity: 1 }] });
  const orders = { content: [order(1, 'PENDING'), order(2, 'PAID'), order(3, 'COMPLETED'), order(4, 'CANCELLED'), order(5, 'FAILED')], totalElements: 5, totalPages: 1, number: 0, size: 10 };
  const animal = (id, gender, status) => ({ id, animalId: id, species: 'DOG', breed: '믹스견', gender, neuterStatus: 'YES', status, imageUrl: origin + '/favicon-96.png', createdAt: '2026-11-01T10:00:00', favoriteCount: 0 });
  const animals = { content: [animal(1, 'MALE', 'PROTECT'), animal(2, 'FEMALE', 'ADOPTED')], totalElements: 2, totalPages: 1, number: 0, size: 20 };
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
    if (path === '/api/v1/users/me/registered-animals') return route.fulfill({ json: { code: 200, data: animals } });
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });
  await page.goto(origin + '/terms');
  await page.evaluate(state => localStorage.setItem('auth-storage', state), JSON.stringify({ state: { user, accessToken: 'test-only-token', refreshToken: null }, version: 0 }));
  const setDark = dark => page.evaluate(on => document.documentElement.classList.toggle('dark', on), dark);
  const colors = locator => locator.evaluate(element => { const style = getComputedStyle(element); return `${style.backgroundColor} / ${style.color}`; });
  // [칩 글자, 라이트 바탕 / 글자, 다크 바탕 / 글자]
  const expectChips = async (rows, prefix) => {
    for (const dark of [false, true]) {
      await setDark(dark);
      for (const [label, light, darkValue] of rows) {
        // 주문 내역은 화면 폭에 따라 카드와 표 중 하나만 보이므로 보이는 칩만 고른다.
        const chip = page.locator('span.rounded-full:visible', { hasText: label }).first();
        await chip.waitFor().catch(async () => { throw new Error(`${prefix}-${label}-missing: ${page.url()} ${(await page.locator('main').innerText().catch(() => '')).slice(0, 200)}`); });
        const expected = dark ? darkValue : light;
        const actual = await colors(chip);
        assert(actual === expected, `${prefix}-${label}-${dark ? 'dark' : 'light'}: ${actual}`);
      }
    }
    await setDark(false);
  };

  await page.setViewportSize({ width: 1920, height: 900 });
  // 모든 칩은 같은 무채색 배지 값이다.
  const neutral = ['rgb(245, 245, 245) / rgb(48, 48, 46)', 'rgb(38, 38, 38) / rgb(231, 229, 228)'];
  await page.goto(origin + '/orders');
  await expectChips(['주문 대기', '결제 완료', '주문 완료', '주문 취소', '결제 실패'].map(label => [label, ...neutral]), 'orders');

  await page.goto(origin + '/registered-animals');
  await expectChips(['보호 중', '입양 완료', '수컷', '암컷', '중성화 완료'].map(label => [label, ...neutral]), 'registered');

  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
