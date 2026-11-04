// Accessible names on mocked data. Icons are SVG components hidden from screen readers (aria-hidden), so a button
// with an icon and text is named by its text, and buttons that show only an icon carry their own name.
async page => {
  const origin = 'http://127.0.0.1:5266';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  const post = id => ({ id, title: `검수 글 ${id}`, content: '검수 본문', boardType: 'COMMUNICATION', authorId: 70 + id, authorName: `작성자${id}`, imageUrls: [], createdAt: '2026-10-30T01:00:00Z' });
  const product = id => ({ id, skuId: 100 + id, name: `검수 상품 ${id}`, price: 10000, totalStock: 3, imageUrl: '', status: 'ACTIVE' });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  await page.route('**/*', async route => {
    const request = route.request();
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(request.url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/') || !['xhr', 'fetch'].includes(request.resourceType())) return route.continue();
    if (path === '/api/v1/posts/read') return route.fulfill({ json: { code: 200, message: 'OK', data: [post(1), post(2)] } });
    if (path === '/api/v1/products') return route.fulfill({ json: { items: [product(1), product(2)], totalCount: 30, currentPage: 0, totalPages: 3, hasNext: true } });
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });
  // Every SVG icon is decorative here; one without aria-hidden would be announced as an unnamed image.
  const leakedIcons = () => page.locator('svg.icon:not([aria-hidden="true"])').count();
  const routes = [
    ['/', () => page.getByRole('banner').waitFor()],
    ['/community', () => page.getByText('검수 글 2').waitFor()],
    ['/products', () => page.getByText('검수 상품 2').first().waitFor()],
    ['/login', () => page.getByRole('heading', { level: 1, name: '로그인' }).waitFor()],
  ];
  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: 1080 });
    for (const [path, ready] of routes) {
      await page.goto(origin + path);
      await ready();
      await page.waitForTimeout(300);
      const leaked = await leakedIcons();
      assert(leaked === 0, `icons-hidden-${path}-${width}: ${leaked}`);
    }
  }
  // A button with an icon and text is named by its text only.
  await page.goto(origin + '/community');
  await page.getByText('검수 글 2').waitFor();
  assert(await page.getByRole('button', { name: '글쓰기', exact: true }).count() === 1, 'write-button-named-by-text');
  // Icon-only buttons have names.
  await page.goto(origin + '/products');
  await page.getByText('검수 상품 2').first().waitFor();
  assert(await page.getByRole('button', { name: '이전 페이지', exact: true }).count() === 1, 'previous-page-named');
  assert(await page.getByRole('button', { name: '다음 페이지', exact: true }).count() === 1, 'next-page-named');
  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
