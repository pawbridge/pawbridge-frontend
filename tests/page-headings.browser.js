// Page headings on mocked data: each screen has exactly one visible h1 that names it, so screen reader users can
// tell where they are and jump to the title. Covers pages that had none or two, and the shared notice cards
// (login required, screen error) that stand in for a whole page.
async page => {
  const origin = 'http://127.0.0.1:5268';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  const post = id => ({ id, title: `검수 후기 ${id}`, content: '검수 본문', boardType: 'ADOPTION', authorId: 70 + id, authorName: `작성자${id}`, imageUrls: [], createdAt: '2026-10-30T01:00:00Z' });
  let user = { id: 99, userId: 99, name: '검수관리자', nickname: '검수', email: 'admin@example.invalid', provider: 'LOCAL', role: 'ROLE_ADMIN', createdAt: '2026-09-01T00:00:00' };
  const empty = { content: [], page: 0, number: 0, size: 10, totalElements: 0, totalPages: 0 };
  const signedIn = value => JSON.stringify({ state: { user: value, accessToken: 'test-only-token', refreshToken: null }, version: 0 });
  const adminUser = user, shelterUser = { ...user, id: 98, userId: 98, role: 'ROLE_SHELTER' };
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/*', async route => {
    const request = route.request();
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(request.url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/') || !['xhr', 'fetch'].includes(request.resourceType())) return route.continue();
    if (path === '/api/v1/posts/read') return route.fulfill({ json: { code: 200, message: 'OK', data: [post(1), post(2)] } });
    if (path === '/api/v1/users/me') return route.fulfill({ json: { code: 200, data: user } });
    if (path === '/api/v1/users/me/wishlists') return route.fulfill({ json: { code: 200, data: { ...empty, size: 20 } } });
    if (path === '/api/v1/orders') return route.fulfill({ json: empty });
    // skus must be an array; a string makes the product screen throw while drawing (screen error card).
    if (path === '/api/v1/products/1') return route.fulfill({ json: { productId: 1, name: '검수 상품', description: '', imageUrl: '', status: 'ACTIVE', skus: 'broken' } });
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });
  // Returns the visible h1 texts once the page has settled (lazy screens show a loading main first).
  const headings = async () => {
    await page.waitForSelector('main:not([aria-busy])', { timeout: 15000 }).catch(() => {});
    await page.locator('h1').first().waitFor({ timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(300);
    return page.locator('h1').evaluateAll(items => items
      .filter(item => item.getClientRects().length > 0 || item.classList.contains('sr-only'))
      .map(item => item.textContent.replace(/\s+/g, ' ').trim()));
  };
  const expectOne = async (path, text, who, width) => {
    await page.goto(origin + path);
    const found = await headings();
    assert(found.length === 1 && found[0] === text, `${who}-${width}-${path}: ${JSON.stringify(found)}`);
  };
  const setUser = async value => {
    await page.goto(origin + '/terms');
    await page.evaluate(value => { localStorage.clear(); if (value) localStorage.setItem('auth-storage', value); }, value);
  };
  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: 1080 });
    await setUser(null);
    await expectOne('/adoption', '입양후기', 'guest', width);
    // The login page title was only in a desktop-only panel; the form title is now the h1 on every width.
    await expectOne('/login', '로그인', 'guest', width);
    await expectOne('/favorite-animals', '로그인이 필요합니다', 'guest', width);
    await expectOne('/admin/users', '로그인이 필요합니다', 'guest', width);
    await expectOne('/products/1', '화면을 표시하지 못했습니다', 'guest', width);
    user = adminUser;
    await setUser(signedIn(user));
    await expectOne('/orders', '주문 내역', 'admin', width);
    await expectOne('/wishlist', '찜한 상품', 'admin', width);
    // My page and animal registration had a second h1 (member name, sidebar logo).
    await page.goto(origin + '/mypage');
    const mypage = await headings();
    assert(mypage.length === 1, `admin-${width}-/mypage: ${JSON.stringify(mypage)}`);
    user = shelterUser;
    await setUser(signedIn(user));
    await expectOne('/animals/new', '동물 등록', 'shelter', width);
  }
  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
