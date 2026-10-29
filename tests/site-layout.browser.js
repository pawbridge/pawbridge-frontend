// Common layout (SiteLayout) rules on mocked data: one site header and footer per screen,
// the header stays mounted while moving between screens, and the mobile menu closes after a move.
async page => {
  const origin = 'http://127.0.0.1:5241';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  // Screens rendered inside SiteLayout. Add a route here when its screen moves into the layout.
  const routes = ['/', '/privacy', '/terms'];
  const animals = [1, 2, 3].map(id => ({ id, species: 'DOG', breed: `검수 동물 ${id}`, gender: 'MALE', birthYear: 2025, status: 'PROTECT', shelterName: '검수 보호소' }));
  const fixtures = {
    '/api/v1/animals': { content: animals, totalElements: 3, totalPages: 1 },
    '/api/v1/animals/stats/status': [{ status: 'PROTECT', count: 2 }, { status: 'ADOPTED', count: 1 }],
    '/api/v1/animals/stats/today': { rescuedToday: 3 },
    '/api/v1/posts/read': { code: 200, data: [] },
    '/api/v1/home/videos': { code: 200, data: [] },
  };
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/*', async route => {
    const request = route.request();
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(request.url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/') || !['xhr', 'fetch'].includes(request.resourceType())) return route.continue();
    const fixture = fixtures[path];
    return route.fulfill({ json: fixture !== undefined ? fixture : { code: 200, data: [], message: '' } });
  });
  // The site header is the only banner landmark; a <header> inside <main> is not one.
  const banners = () => page.getByRole('banner').count();
  const footers = () => page.getByRole('contentinfo').count();
  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: 1080 });
    for (const route of routes) {
      await page.goto(origin + route);
      await page.locator('main').first().waitFor();
      assert(await banners() === 1, `one-header-${route}-${width}`);
      assert(await footers() === 1, `one-footer-${route}-${width}`);
    }
    // Moving with a link inside the app keeps the same header element instead of drawing a new one.
    await page.goto(origin + '/');
    await page.locator('main').first().waitFor();
    await page.getByRole('banner').evaluate(header => { header.dataset.layoutProbe = 'kept'; });
    await page.getByRole('contentinfo').getByRole('link', { name: '이용약관', exact: true }).click();
    await page.waitForURL('**/terms');
    assert(await page.getByRole('banner').getAttribute('data-layout-probe') === 'kept', `header-kept-on-move-${width}`);
    if (width === 390) {
      const menuButton = page.getByRole('button', { name: '메뉴 열기' });
      await menuButton.click();
      assert(await page.getByRole('navigation', { name: '모바일 메뉴' }).isVisible(), 'mobile-menu-opens');
      await page.evaluate(() => { history.pushState({}, '', '/privacy'); dispatchEvent(new PopStateEvent('popstate')); });
      await page.waitForURL('**/privacy');
      await page.getByRole('heading', { level: 1 }).waitFor();
      assert(!(await page.getByRole('navigation', { name: '모바일 메뉴' }).isVisible()), 'mobile-menu-closes-after-move');
    }
  }
  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
