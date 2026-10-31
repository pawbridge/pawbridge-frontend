// Error boundaries on mocked data: a screen that throws while drawing shows a guidance card instead of a blank page.
// Inside SiteLayout the header and footer stay and moving to another address draws again;
// outside it (admin) the top-level boundary shows the same card on its own.
async page => {
  const origin = 'http://127.0.0.1:5263';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  // skus must be an array; a string makes the product screen throw while drawing.
  const brokenProduct = { productId: 1, name: '검수 상품 1', description: '검수용 상품', imageUrl: '', status: 'ACTIVE', skus: 'broken' };
  // content must be an array; a string makes the admin member screen throw while drawing.
  const brokenMembers = { code: 200, data: { content: 'broken', totalElements: 1, totalPages: 1, number: 0, size: 1000 } };
  const admin = { state: { user: { id: 99, name: '관리자', email: 'admin@example.invalid', role: 'ROLE_ADMIN' }, accessToken: 'synthetic-local-token', refreshToken: null }, version: 0 };
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/*', async route => {
    const request = route.request();
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(request.url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/') || !['xhr', 'fetch'].includes(request.resourceType())) return route.continue();
    if (path === '/api/v1/products/1') return route.fulfill({ json: brokenProduct });
    if (path === '/api/v1/admin/users') return route.fulfill({ json: brokenMembers });
    // Other APIs fail like a server error, which screens handle on their own (no thrown render).
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });
  const card = () => page.getByRole('alert').filter({ hasText: '화면을 표시하지 못했습니다' });
  const banners = () => page.getByRole('banner').count();
  const footers = () => page.getByRole('contentinfo').count();
  await page.goto(origin + '/terms');
  await page.evaluate(() => localStorage.clear());
  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: 1080 });
    // Inside SiteLayout: the card takes the page area, the header and footer stay.
    await page.goto(origin + '/products/1');
    await card().waitFor();
    assert(await page.getByRole('main').getByRole('alert').count() === 1, `site-card-in-main-${width}`);
    assert(await banners() === 1 && await footers() === 1, `site-card-keeps-layout-${width}`);
    // Moving to another address inside the app clears the error and draws the new screen.
    await page.getByRole('contentinfo').getByRole('link', { name: '이용약관', exact: true }).click();
    await page.waitForURL('**/terms');
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert(await card().count() === 0, `site-card-cleared-on-move-${width}`);
    // Back to the broken screen shows the card again.
    await page.goBack();
    await page.waitForURL('**/products/1');
    await card().waitFor();
    assert(await banners() === 1, `site-card-again-after-back-${width}`);
  }
  // "새로고침" reloads the whole page.
  await page.evaluate(() => { window.reloadProbe = 'before'; });
  await Promise.all([page.waitForEvent('load'), card().getByRole('button', { name: '새로고침', exact: true }).click()]);
  await card().waitFor();
  assert(await page.evaluate(() => window.reloadProbe) === undefined, 'reload-button-reloads');
  // Outside SiteLayout (admin): the top-level boundary shows the card without the site header.
  await page.evaluate(value => localStorage.setItem('auth-storage', value), JSON.stringify(admin));
  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto(origin + '/admin/users');
    await card().waitFor();
    assert(await banners() === 0, `root-card-alone-${width}`);
  }
  // "홈으로" leaves the broken screen for the home page.
  await card().getByRole('link', { name: '홈으로', exact: true }).click();
  await page.waitForURL(origin + '/');
  await page.getByRole('banner').waitFor();
  assert(await card().count() === 0, 'home-link-leaves-error');
  // Caught errors are logged by React with console.error, not thrown to the page.
  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
