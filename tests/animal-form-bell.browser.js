// Animal registration and edit screens (own header) on mocked data: the bell is the same contact alert as the
// site header. It shows a count only when there are unread notes, and opens the note alert list.
async page => {
  const origin = 'http://127.0.0.1:5269';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  const user = { id: 98, userId: 98, name: '검수보호소', nickname: '검수보호소', email: 'shelter@example.invalid', provider: 'LOCAL', role: 'ROLE_SHELTER', careRegNo: '311000000001', createdAt: '2026-09-01T00:00:00' };
  const animal = { animalId: 1, id: 1, species: 'DOG', breed: '믹스견', gender: 'MALE', neuterStatus: 'YES', status: 'PROTECT', careRegNo: '311000000001', apiSource: 'MANUAL', imageUrl: '' };
  const note = index => ({ noteId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`, kind: 'PRIVATE_NOTE', actorId: 10 + index, actorNickname: `검수회원${index}`, createdAt: '2026-10-30T01:00:00Z', href: `/notes/${index}`, read: false });
  let unread = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/*', async route => {
    const request = route.request();
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(request.url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/')) return route.continue();
    // Keep the push stream closed so the list comes only from the REST page below.
    if (path === '/api/v1/notes/stream') return route.fulfill({ status: 429, body: '' });
    if (path === '/api/v1/notes/notifications') return route.fulfill({ json: { data: { content: unread, nextCursor: null, unreadCount: unread.length } } });
    if (path === '/api/v1/users/me') return route.fulfill({ json: { code: 200, data: user } });
    if (path === '/api/v1/animals/1') return route.fulfill({ json: { code: 200, data: animal } });
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });
  await page.goto(origin + '/terms');
  await page.evaluate(value => localStorage.setItem('auth-storage', value), JSON.stringify({ state: { user, accessToken: 'test-only-token', refreshToken: null }, version: 0 }));
  const bell = () => page.getByRole('button', { name: /^알림,/ });
  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, path, title] of [['create', '/animals/new', '동물 등록'], ['edit', '/animals/1/edit', '동물 수정']]) {
      // No unread notes: the bell carries no dot or number.
      unread = [];
      await page.goto(origin + path);
      await page.getByRole('heading', { level: 1, name: title }).waitFor();
      await bell().waitFor();
      assert(await bell().count() === 1, `${name}-${width}-one-bell`);
      assert((await bell().getAttribute('aria-label')).includes('읽지 않은 쪽지 0개'), `${name}-${width}-zero-label`);
      assert((await bell().innerText()).trim() === '', `${name}-${width}-no-badge`);
      // Two unread notes: the bell shows 2 and opens the list with both.
      unread = [note(1), note(2)];
      await page.reload();
      await page.getByRole('heading', { level: 1, name: title }).waitFor();
      await page.waitForFunction(() => /읽지 않은 쪽지 2개/.test(document.querySelector('[aria-controls="private-note-notifications"]')?.getAttribute('aria-label') ?? ''));
      assert((await bell().innerText()).trim() === '2', `${name}-${width}-badge-count`);
      await bell().click();
      const list = page.getByRole('region', { name: '알림 목록' });
      await list.waitFor();
      assert(await list.getByRole('link', { name: /검수회원\d님에게 쪽지가 왔어요/ }).count() === 2, `${name}-${width}-list-opens`);
      await page.keyboard.press('Escape');
    }
  }
  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
