// Real browser/cookie/storage interactions with a synthetic visitor HTTP provider.
// This does not claim production or a browser-to-PostgreSQL integration test.
async (browser, fixture) => {
  const checks = [];
  const assert = (ok, name) => { if (!ok) throw new Error(name); checks.push(name); console.log('PASS: ' + name); };
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
  const shift = (day, amount) => { const date = new Date(day + 'T00:00:00Z'); date.setUTCDate(date.getUTCDate() + amount); return date.toISOString().slice(0, 10); };
  let issued = 0, total = 0, writes = 0, failRead = false, cookieBlocked = false;
  let readCount;
  const counted = new Set();
  const publicHeaders = [];
  async function context(options = {}) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 },
      userAgent: 'Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36', ...options });
    ctx.on('page', item => item.on('pageerror', error => console.error('Local page error: ' + error.message.slice(0, 300))));
    await ctx.route(fixture.origin + '/api/**', async route => {
      const req = route.request(), url = new URL(req.url()), path = url.pathname, method = req.method();
      const reply = (data, status = 200) => route.fulfill({ status, json: { code: status, data } });
      if (path.startsWith('/api/visits/')) {
        const headers = await req.allHeaders();
        publicHeaders.push(headers);
        const id = (headers.cookie || '').match(/(?:^|;\s*)__Host-pb_visit=([^;]+)/)?.[1];
        if (method === 'POST') writes++;
        if (path.endsWith('/identity')) {
          const cookie = id || 'synthetic-' + ++issued;
          if (!id) await new Promise(resolve => setTimeout(resolve, 80)); // Expose initial-tab races.
          return route.fulfill({ status: 204, headers: cookieBlocked || id ? {} : {
            'set-cookie': '__Host-pb_visit=' + cookie + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600',
          } });
        }
        if (method === 'POST') {
          if (!id) return reply(null, 409);
          if (!counted.has(id)) { counted.add(id); total++; }
        }
        if (failRead && method === 'GET') return reply(null, 503);
        return reply({ date: today, count: method === 'GET' && readCount !== undefined ? readCount : total });
      }
      if (path === '/api/admin/visits/stats/period') {
        return reply({ startDate: url.searchParams.get('startDate'), endDate: url.searchParams.get('endDate'),
          today, collectionStartedAt: shift(today, -2) + 'T03:00:00Z',
          daily: [{ date: shift(today, -2), count: 3 }, { date: shift(today, -1), count: 0 }, { date: today, count: 12 }] });
      }
      if (path === '/api/animals') return route.fulfill({ json: { content: [], totalPages: 0 } });
      if (path === '/api/v1/animals/stats/today') return route.fulfill({ json: { rescuedToday: 0 } });
      if (path === '/api/v1/animals/stats/status') return route.fulfill({ json: [] });
      if (path.includes('/notifications')) return reply({ content: [], unreadCount: 0, nextCursor: null });
      if (path.startsWith('/api/notes')) return reply({ content: [], totalPages: 0 });
      if (path.startsWith('/api/admin/stats')) return route.fulfill({ json: { daily: [], previousDayCount: 0 } });
      return reply([]);
    });
    return ctx;
  }
  const ctx = await context();
  const page = await ctx.newPage();
  await page.goto(fixture.origin);
  await page.getByLabel('오늘 방문 1', { exact: true }).waitFor();
  assert(total === 1, 'first-entry-two-requests-count-without-click');
  const cookie = (await ctx.cookies()).find(item => item.name === '__Host-pb_visit');
  assert(cookie?.httpOnly && cookie?.secure && cookie.sameSite === 'Lax' && cookie.path === '/', 'http-only-secure-cookie-actually-stored');
  await page.reload();
  await page.getByLabel('오늘 방문 1', { exact: true }).waitFor();
  assert(total === 1, 'reload-is-idempotent');
  await page.evaluate(() => window.useAuthStore.setState({ user: { id: 7, role: 'ROLE_USER' }, accessToken: 'synthetic-no-real-token' }));
  const tab = await ctx.newPage();
  await tab.goto(fixture.origin);
  await tab.getByLabel('오늘 방문 1', { exact: true }).waitFor();
  assert(total === 1, 'second-tab-reuses-cookie');
  assert(publicHeaders.every(item => !item.authorization && !item['x-user-id']), 'public-calls-do-not-send-account-identifiers');
  await ctx.clearCookies({ name: '__Host-pb_visit' });
  await page.reload();
  await page.getByLabel('오늘 방문 2', { exact: true }).waitFor();
  assert(total === 2, 'deleted-cookie-new-visit-is-not-secretly-restored');
  await ctx.close();

  for (const fallback of [false, true]) {
    issued = 0; total = 0; counted.clear();
    const concurrent = await context();
    if (fallback) await concurrent.addInitScript(() => Object.defineProperty(navigator, 'locks', { value: undefined }));
    const tabs = await Promise.all([concurrent.newPage(), concurrent.newPage(), concurrent.newPage()]);
    await Promise.all(tabs.map(item => item.goto(fixture.origin)));
    await Promise.all(tabs.map(item => item.getByLabel('오늘 방문 1', { exact: true }).waitFor()));
    assert(total === 1 && issued === 1, fallback ? 'indexeddb-fallback-first-tabs-one-identity' : 'web-locks-first-tabs-one-identity');
    await concurrent.close();
  }
  total = 0; counted.clear(); cookieBlocked = true;
  const blocked = await context();
  const blockedPage = await blocked.newPage();
  await blockedPage.goto(fixture.origin);
  await blockedPage.getByLabel('오늘 방문 0', { exact: true }).waitFor();
  await blockedPage.waitForTimeout(400);
  assert(total === 0, 'cookie-not-stored-does-not-inflate-count');
  await blocked.close(); cookieBlocked = false;

  const display = await context();
  const screen = await display.newPage();
  await screen.goto(fixture.origin);
  await screen.getByLabel('오늘 방문 1', { exact: true }).waitFor();
  for (const width of [1440, 390, 320]) {
    await screen.setViewportSize({ width, height: 1000 });
    await screen.locator('footer').scrollIntoViewIfNeeded();
    assert(await screen.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no-horizontal-overflow-' + width);
    await screen.screenshot({ path: fixture.evidence + '/footer-' + width + '.png' });
  }
  readCount = 123456789;
  await screen.reload();
  await screen.getByLabel('오늘 방문 123,456,789', { exact: true }).waitFor();
  await screen.locator('footer').scrollIntoViewIfNeeded();
  assert(await screen.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'long-number-wraps-without-overflow-320');
  await screen.screenshot({ path: fixture.evidence + '/footer-long-320.png' });
  readCount = undefined;
  await display.close();

  const admin = await context();
  await admin.addInitScript(() => {
    if (location.hostname !== '127.0.0.1') return;
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { user: { id: 7, role: 'ROLE_ADMIN', name: '시험 관리자' }, accessToken: 'synthetic-admin-token', refreshToken: null }, version: 0,
    }));
  });
  const dashboard = await admin.newPage();
  const before = writes;
  await dashboard.goto(fixture.origin + '/admin/statistics');
  await dashboard.getByRole('button', { name: '방문', exact: true }).click();
  await dashboard.getByRole('heading', { name: '일별 방문 추이', exact: true }).waitFor();
  await dashboard.getByRole('heading', { name: '어제 방문', exact: true }).waitFor();
  await dashboard.getByRole('heading', { name: '방문 통계', exact: true }).waitFor();
  assert(writes === before, 'admin-route-never-counts');
  assert(await dashboard.getByText('집계 시작일 일부', { exact: true }).isVisible(), 'uncollected-days-and-first-partial-day-distinguished');
  assert(await dashboard.getByRole('button', { name: today + ' 12', exact: true }).isVisible(), 'chart-numeric-value-and-accessible-label');
  for (const width of [1440, 390, 320]) {
    await dashboard.setViewportSize({ width, height: 1000 });
    assert(await dashboard.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'admin-no-horizontal-overflow-' + width);
    await dashboard.screenshot({ path: fixture.evidence + '/admin-' + width + '.png', fullPage: true });
  }
  await admin.close();

  failRead = true;
  const failing = await context();
  const failedPage = await failing.newPage();
  await failedPage.goto(fixture.origin);
  await failedPage.locator('footer').waitFor();
  await failedPage.waitForTimeout(600);
  assert(await failedPage.getByText('오늘 방문', { exact: true }).count() === 0, 'read-failure-hides-number-instead-of-zero');
  await failing.close();
  return { mode: 'synthetic-http-real-browser', checks, evidence: fixture.evidence };
}
