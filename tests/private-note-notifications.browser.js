// Local UI regression only. Synthetic auth and intercepted APIs are not a backend E2E test.
async (page) => {
  const origin = 'http://127.0.0.1:5184';
  const results = [];
  const errors = [];
  await page.unroute('**/api/**');
  let failOlderPage = false;
  let holdNextFirstPage = false;
  let releaseFirstPage;
  let observeHeldPage;
  let notifications = Array.from({ length: 50 }, (_, index) => {
    const noteId = `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
    return {
      noteId,
      kind: 'PRIVATE_NOTE',
      actorId: index + 10,
      actorNickname: `합성회원${index + 1}`,
      createdAt: new Date(Date.UTC(2026, 9, 6, 8, 50 - index)).toISOString(),
      href: `/notes/${noteId}`,
      read: false,
    };
  });
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/**', async (route) => {
    if (!['fetch', 'xhr'].includes(route.request().resourceType())) return route.continue();
    const [path, query = ''] = route
      .request()
      .url()
      .replace(/^https?:\/\/[^/]+/, '')
      .split('?');
    if (path === '/api/notes/stream') {
      // Prevent fixture reconnects from adding unrelated refreshes during this REST regression.
      return route.fulfill({ status: 429, body: '' });
    }
    if (path === '/api/notes/notifications') {
      const cursor = query
        .split('&')
        .find((value) => value.startsWith('cursor='))
        ?.slice(7);
      if (!cursor && holdNextFirstPage) {
        holdNextFirstPage = false;
        observeHeldPage();
        await new Promise((resolve) => {
          releaseFirstPage = resolve;
        });
      }
      if (failOlderPage && cursor) return route.fulfill({ status: 503, json: { code: 503 } });
      const start = cursor ? notifications.findIndex((item) => item.noteId === cursor) + 1 : 0;
      const content = notifications.slice(start, start + 20);
      return route.fulfill({
        json: {
          data: {
            content,
            nextCursor: start + 20 < notifications.length ? content.at(-1).noteId : null,
            unreadCount: notifications.filter((item) => !item.read).length,
          },
        },
      });
    }
    if (path === '/api/notes') {
      return route.fulfill({
        json: {
          data: {
            content: notifications.slice(0, 10).map((item) => ({
              ...item,
              counterpartId: item.actorId,
              counterpartNickname: item.actorNickname,
              direction: 'INBOX',
              body: '합성 시험용 쪽지 제목\n실제 개인정보나 운영 본문이 아닙니다.',
              readAt: null,
              favorite: false,
              canReply: true,
              expiresAt: '2027-10-06T08:00:00Z',
            })),
            totalElements: notifications.length,
            totalPages: 5,
            number: 0,
            size: 10,
          },
        },
      });
    }
    return route.fulfill({ status: 501, json: { code: 501 } });
  });
  await page.goto(origin);
  await page.evaluate(() =>
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: {
            id: 7,
            nickname: '시험회원',
            email: 'note-review@example.invalid',
            role: 'ROLE_USER',
          },
          accessToken: 'synthetic-browser-only',
          refreshToken: null,
        },
        version: 0,
      }),
    ),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin}/notes`);
  await page.getByRole('heading', { name: '연락 공간', exact: true }).waitFor();
  const bell = page.getByRole('button', { name: /^쪽지 알림/ });
  const panel = page.getByRole('region', { name: '쪽지 알림 목록' });
  const notificationLinks = panel.locator('a[href^="/notes/"]');
  await bell.click();
  await page.waitForFunction(
    () => document.querySelectorAll('#private-note-notifications a[href^="/notes/"]').length === 20,
  );
  const heldPageObserved = new Promise((resolve) => {
    observeHeldPage = resolve;
  });
  const delayedRefreshFinished = page.waitForResponse((response) =>
    response.url().endsWith('/api/notes/notifications'),
  );
  holdNextFirstPage = true;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await heldPageObserved;
  await panel.getByRole('button', { name: '이전 알림 더 보기' }).click();
  await page.waitForFunction(
    () => document.querySelectorAll('#private-note-notifications a[href^="/notes/"]').length === 40,
  );
  results.push('desktop: first 20 then expanded 40');
  releaseFirstPage();
  await delayedRefreshFinished;
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  check(
    (await notificationLinks.count()) === 40,
    'An older in-flight refresh overwrote the expanded list',
  );
  results.push('late in-flight refresh cannot overwrite a newly opened page');

  const refreshedPage = page.waitForResponse((response) =>
    response.url().includes('/api/notes/notifications?cursor='),
  );
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await refreshedPage;
  check((await notificationLinks.count()) === 40, 'Refresh reset expanded history');
  results.push('focus refresh preserves all opened pages');

  const removedId = notifications[30].noteId;
  const readId = notifications[25].noteId;
  notifications = notifications.filter((item) => item.noteId !== removedId);
  notifications.find((item) => item.noteId === readId).read = true;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.waitForFunction(
    (id) => !document.querySelector(`#private-note-notifications a[href="/notes/${id}"]`),
    removedId,
  );
  check((await notificationLinks.count()) === 40, 'Refresh should refill opened history');
  check(
    (await panel
      .locator(`a[href="/notes/${readId}"]`)
      .getByText('읽지 않음', { exact: true })
      .count()) === 0,
    'Older read state was stale',
  );
  check(
    !(await panel.textContent()).includes('합성 시험용 쪽지 제목'),
    'Notifications must not include note bodies',
  );
  results.push('older-page deletion and read state refresh without body previews');

  failOlderPage = true;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await panel.getByText('알림을 불러오지 못했어요.', { exact: false }).waitFor();
  check((await notificationLinks.count()) === 40, 'A partial failed refresh erased history');
  failOlderPage = false;
  await panel.getByRole('button', { name: '다시 시도' }).click();
  await panel.getByText('알림을 불러오지 못했어요.', { exact: false }).waitFor({ state: 'hidden' });
  results.push('older-page failure preserves history and retry recovers');
  await page.screenshot({ path: '/tmp/private-note-notifications-desktop.png', fullPage: true });
  await bell.focus();
  await page.keyboard.press('Escape');
  check(
    await bell.evaluate((element) => element === document.activeElement),
    'Escape must restore trigger focus',
  );
  await page.screenshot({ path: '/tmp/private-notes-readable-desktop.png', fullPage: true });

  await page.setViewportSize({ width: 375, height: 900 });
  await page.reload();
  await bell.click();
  await page.waitForFunction(
    () => document.querySelectorAll('#private-note-notifications a[href^="/notes/"]').length === 20,
  );
  await panel.getByRole('button', { name: '이전 알림 더 보기' }).click();
  await page.waitForFunction(
    () => document.querySelectorAll('#private-note-notifications a[href^="/notes/"]').length === 40,
  );
  check(
    !(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)),
    'Mobile horizontal overflow',
  );
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector('#private-note-notifications .overflow-y-auto').scrollTop = 0;
  });
  await page.screenshot({ path: '/tmp/private-note-notifications-mobile.png', fullPage: true });
  await bell.focus();
  await page.keyboard.press('Escape');
  await panel.waitFor({ state: 'hidden' });
  await page.screenshot({ path: '/tmp/private-notes-readable-mobile.png', fullPage: true });
  results.push('375px: expanded notifications, no horizontal overflow, Escape closes');
  check(errors.length === 0, errors.join('\n'));
  results.push('no uncaught page errors');
  return { api: 'mock-only', results, checks: results.length };
}
