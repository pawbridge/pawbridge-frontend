// Synthetic API/auth only. Exercise warm-cache behavior through rendered SPA transitions.
async (page, origin = 'http://127.0.0.1:5187') => {
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) throw new Error('Loopback test origin required');
  let blocked = false;
  let held = false;
  const releases = new Set();
  const errors = [];
  const recordError = error => errors.push(error.message);
  const release = () => { releases.forEach(resolve => resolve()); releases.clear(); };
  const noteId = '12345678-1234-4567-89ab-123456789abc';
  const title = '차단 캐시 회귀 검증 글';
  const handler = async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return url.origin === origin ? route.continue() : route.abort();
    let data = { content: [], nextCursor: null, unreadCount: 0, totalPages: 0, totalElements: 0 };
    if (url.pathname.includes('ticket')) return route.fulfill({ status: 503, json: { message: 'Synthetic stream disabled' } });
    if (url.pathname === '/api/posts/read') data = [{ postId: 41, title, authorId: 2, authorName: '합성 작성자', boardType: 'COMMUNICATION', imageUrls: [], createdAt: '2026-10-11T01:00:00Z' }];
    if (url.pathname === '/api/notes/recipients/2') data = { userId: 2, nickname: '합성 작성자', active: true };
    if (url.pathname === '/api/notes/blocks/2') {
      blocked = route.request().method() === 'PUT';
      return route.fulfill({ status: 204 });
    }
    if (url.pathname === '/api/notes/blocks/status') {
      const memberIds = blocked ? [2] : [];
      if (held) await new Promise(resolve => { releases.add(resolve); });
      data = { memberIds };
    }
    if (url.pathname === '/api/notes/blocks') data = { content: blocked ? [{ memberId: 2, nickname: '합성 작성자', createdAt: '2026-10-11T01:00:00Z' }] : [], totalPages: 1 };
    if (url.pathname === '/api/notes') data = { content: [{ noteId, body: '합성 쪽지', counterpartNickname: '합성 작성자', createdAt: '2026-10-11T01:00:00Z' }], totalPages: 1, totalElements: 1 };
    if (url.pathname === `/api/notes/${noteId}`) data = { noteId, counterpartId: 2, counterpartNickname: '합성 작성자', direction: 'INBOX', body: '합성 쪽지', readAt: '2026-10-11T01:00:00Z', contextHref: '/community', createdAt: '2026-10-11T01:00:00Z' };
    try { return await route.fulfill({ json: { code: 200, data } }); }
    catch (error) { if (!route.request().failure() && !/already handled|closed/.test(error.message)) throw error; }
  };
  await page.addInitScript(() => localStorage.setItem('auth-storage', JSON.stringify({
    state: { user: { id: 1, name: '합성 사용자', role: 'ROLE_USER' }, accessToken: 'synthetic-test-token', refreshToken: null }, version: 0,
  })));
  await page.route('**/*', handler);
  page.on('pageerror', recordError);
  const accept = dialog => dialog.accept();
  page.on('dialog', accept);
  try {
    await page.goto(`${origin}/community`, { waitUntil: 'domcontentloaded' });
    await page.getByText(title, { exact: true }).waitFor();
    await page.getByRole('button', { name: '합성 작성자에게 연락하기', exact: true }).click();
    await page.getByRole('link', { name: '쪽지 보내기', exact: true }).click();
    await page.getByRole('link', { name: '쪽지', exact: true }).click();
    await page.locator(`a[href="/notes/${noteId}"]`).click();
    await page.getByRole('button', { name: '회원 차단', exact: true }).click();
    await page.getByText('회원을 차단했습니다. 차단 관리에서 해제할 수 있습니다.', { exact: true }).waitFor();
    held = true;
    const checking = page.waitForRequest('**/api/notes/blocks/status**', { timeout: 10000 });
    await page.getByRole('link', { name: '연락한 글 보기', exact: true }).click();
    await checking;
    if (await page.getByText(title, { exact: true }).count()) throw new Error('Warm unblocked cache exposed a blocked post');
    held = false; release();
    await page.getByText('차단한 회원의 글입니다.', { exact: true }).waitFor();
    await page.screenshot({ path: '/tmp/pawbridge-block-cache-desktop.png', fullPage: true });
    await page.getByRole('button', { name: '이 글 보기', exact: true }).click();
    await page.getByText(title, { exact: true }).waitFor();
    await page.setViewportSize({ width: 375, height: 900 });
    await page.getByRole('button', { name: '합성 작성자에게 연락하기', exact: true }).click();
    await page.getByRole('link', { name: '쪽지 보내기', exact: true }).click();
    await page.getByRole('link', { name: '차단 관리', exact: true }).click();
    await page.getByRole('button', { name: '차단 해제', exact: true }).click();
    await page.getByText('차단한 회원이 없습니다.', { exact: true }).waitFor();
    await page.goBack(); await page.goBack();
    await page.getByText(title, { exact: true }).waitFor();
    if (await page.getByText('차단한 회원의 글입니다.', { exact: true }).count()) throw new Error('Unblocking kept stale folded content');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile overflow');
    if (errors.length) throw new Error(`Uncaught page errors: ${errors.join('; ')}`);
    await page.screenshot({ path: '/tmp/pawbridge-block-cache-mobile.png', fullPage: true });
    return { checks: ['warm-cache-reentry-after-block', 'explicit-expansion', 'unblock-cache-refresh', 'mobile'], mocked: ['auth', 'all-api-responses'], productionVerified: false };
  } finally {
    held = false; release();
    page.off('dialog', accept);
    page.off('pageerror', recordError);
    await page.unroute('**/*', handler);
  }
}
