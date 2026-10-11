// Synthetic API/auth only. Exercise SPA navigation without resetting the query cache.
async (page, origin = 'http://127.0.0.1:5186') => {
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) throw new Error('Loopback test origin required');
  const roomId = '12345678-1234-4567-89ab-123456789abc';
  let lookup = { roomId: null };
  let held = false;
  const releases = new Set();
  const errors = [];
  const recordError = error => errors.push(error.message);
  const release = () => { releases.forEach(resolve => resolve()); releases.clear(); };
  const handler = async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return url.origin === origin ? route.continue() : route.abort();
    let data = { content: [], nextCursor: null, unreadCount: 0, totalPages: 0, totalElements: 0 };
    if (url.pathname === '/api/chats/with/2') {
      const response = lookup;
      if (held) {
        await new Promise(resolve => { releases.add(resolve); });
      }
      try { return await route.fulfill({ json: { code: 200, data: response } }); }
      catch (error) { if (!route.request().failure() && !/already handled|closed/.test(error.message)) throw error; }
      return;
    }
    if (url.pathname.includes('ticket')) return route.fulfill({ status: 503, json: { message: 'Synthetic socket disabled' } });
    if (url.pathname === '/api/notes/recipients/2') data = { userId: 2, nickname: '합성 상대', active: true };
    if (url.pathname === `/api/chats/${roomId}`) data = { roomId, counterpartId: 2, counterpartNickname: '합성 상대', canSend: true };
    if (url.pathname === `/api/chats/${roomId}/messages`) data = {
      content: [{ roomId, sequence: 1, senderId: 2, body: '기존 대화 기록', contextHref: null, createdAt: '2026-10-11T01:00:00Z' }], nextCursor: null,
    };
    return route.fulfill({ json: { code: 200, data } });
  };
  await page.addInitScript(() => localStorage.setItem('auth-storage', JSON.stringify({
    state: { user: { id: 1, name: '합성 사용자', role: 'ROLE_USER' }, accessToken: 'synthetic-test-token', refreshToken: null }, version: 0,
  })));
  await page.route('**/*', handler);
  page.on('pageerror', recordError);
  const waitForLookup = () => page.waitForRequest('**/api/chats/with/2', { timeout: 10000 });
  try {
    await page.goto(`${origin}/chats/new?to=2`, { waitUntil: 'domcontentloaded' });
    const input = page.getByLabel('메시지', { exact: true });
    await input.waitFor();
    await input.fill('재조회 중에도 보존할 작성 내용');
    await page.screenshot({ path: '/tmp/pawbridge-chat-cache-desktop.png', fullPage: true });
    // Background invalidation must not unmount a form already approved for this entry.
    held = true;
    const refreshing = waitForLookup();
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await refreshing;
    if (await input.inputValue() !== '재조회 중에도 보존할 작성 내용') throw new Error('Background refresh lost the draft');
    const refreshed = page.waitForResponse('**/api/chats/with/2');
    held = false; release();
    await (await refreshed).finished();
    if (await input.inputValue() !== '재조회 중에도 보존할 작성 내용') throw new Error('Completed background refresh lost the draft');
    await page.getByRole('link', { name: '쪽지', exact: true }).click();
    await page.waitForURL(`${origin}/notes`);
    await page.getByRole('heading', { name: '쪽지', exact: true }).waitFor();
    await page.setViewportSize({ width: 375, height: 900 });
    lookup = { roomId };
    held = true;
    const revisiting = waitForLookup();
    await page.goBack();
    await revisiting;
    if (await input.count()) throw new Error('Cached no-room result exposed a new-message form during reentry');
    await page.getByText('이전 대화를 확인하는 중입니다…', { exact: true }).waitFor();
    held = false; release();
    await page.waitForURL(`${origin}/chats/${roomId}`);
    await page.getByText('기존 대화 기록', { exact: true }).waitFor();
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile overflow');
    if (errors.length) throw new Error(`Uncaught page errors: ${errors.join('; ')}`);
    await page.screenshot({ path: '/tmp/pawbridge-chat-cache-mobile.png', fullPage: true });
    return { checks: ['background-refresh-preserves-draft', 'warm-cache-spa-reentry-waits', 'existing-history-after-refresh', 'mobile'], mocked: ['auth', 'all-api-responses'], productionVerified: false };
  } finally {
    held = false; release();
    page.off('pageerror', recordError);
    await page.unroute('**/*', handler);
  }
}
