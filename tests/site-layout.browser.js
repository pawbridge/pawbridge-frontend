// Common layout (SiteLayout) rules on mocked data: one site header and footer per screen,
// the header stays mounted while moving between screens, and the mobile menu closes after a move.
async page => {
  const origin = 'http://127.0.0.1:5241';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  // Screens rendered inside SiteLayout. Add a route here when its screen moves into the layout.
  const routes = ['/', '/privacy', '/terms', '/animals', '/animals/lost', '/animals/stats', '/animals/1',
    '/reports/missing', '/reports/sightings', '/reports/1'];
  // Screens inside SiteLayout that need a login (RequireLogin).
  const loginRoutes = ['/favorite-animals', '/registered-animals', '/reports/new', '/reports/1/edit'];
  const animals = [1, 2, 3].map(id => ({ id, species: 'DOG', breed: `검수 동물 ${id}`, gender: 'MALE', birthYear: 2025, status: 'PROTECT', shelterName: '검수 보호소' }));
  const animal = { id: 1, breed: '믹스견', species: 'DOG', gender: 'MALE', age: 2, weight: '4', status: 'PROTECT', shelterId: 1, shelterName: '검증 보호소', images: [], createdAt: '2026-09-22T10:00:00' };
  const report = (reportId, kind) => ({ reportId, authorId: 7, authorNickname: '합성 작성자', kind, title: `합성 제보 ${reportId}`, occurredOn: '2026-10-11', approximateTime: null, region: '서울', landmark: null, species: '고양이', animalName: null, coatColor: null, animalSize: null, distinguishingFeatures: null, direction: null, description: '합성 본문', imageUrls: [], createdAt: '2026-10-11T01:00:00Z', updatedAt: '2026-10-11T01:00:00Z' });
  // Shapes follow the API modules (some endpoints are not wrapped in an envelope).
  const fixtures = {
    '/api/v1/animals': { content: animals, totalElements: 3, totalPages: 1 },
    '/api/v1/animals/1': animal,
    '/api/v1/animals/stats/status': [{ status: 'PROTECT', label: '보호중', count: 2 }, { status: 'ADOPTED', label: '입양', count: 1 }],
    '/api/v1/animals/stats/today': { date: '2026-10-29', rescuedToday: 3, adoptedToday: 1 },
    '/api/v1/animals/stats/regional': [{ region: '서울특별시', count: 100 }],
    '/api/v1/posts/read': { code: 200, data: [] },
    '/api/v1/home/videos': { code: 200, data: [] },
    '/api/v1/reports': { code: 200, data: { content: [report(1, 'MISSING')], totalPages: 1 } },
    '/api/v1/reports/1': { code: 200, data: report(1, 'MISSING') },
    '/api/v1/users/me/favorite-animals': { code: 200, data: { userId: 7, totalCount: 0, favorites: [] } },
    '/api/v1/users/me/registered-animals': { code: 200, data: { content: [], number: 0, size: 20, totalElements: 0, totalPages: 0 } },
    '/api/v1/favorites/1/check': { code: 200, data: false },
  };
  const member = { state: { user: { id: 7, name: '로컬 회원', role: 'ROLE_USER', email: 'layout@example.invalid' }, accessToken: 'synthetic-local-token', refreshToken: null }, version: 0 };
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
  const signIn = async signedIn => {
    await page.goto(origin + '/terms');
    await page.evaluate(value => { localStorage.clear(); if (value) localStorage.setItem('auth-storage', value); }, signedIn ? JSON.stringify(member) : null);
  };
  // A logged-out visit to a login screen keeps the header and footer and shows the login card in the page area.
  await page.setViewportSize({ width: 1920, height: 1080 });
  await signIn(false);
  for (const route of loginRoutes) {
    await page.goto(origin + route);
    const login = page.getByRole('main').getByRole('link', { name: '로그인', exact: true });
    await login.waitFor();
    assert(await banners() === 1 && await footers() === 1, `login-card-keeps-layout-${route}`);
    await login.click();
    await page.waitForURL('**/login');
    assert(await page.evaluate(() => history.state?.usr?.from) === route, `login-card-returns-to-${route}`);
  }
  await signIn(true);
  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: 1080 });
    for (const route of [...routes, ...loginRoutes]) {
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
