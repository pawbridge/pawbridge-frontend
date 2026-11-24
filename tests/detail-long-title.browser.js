// 커뮤니티와 입양후기 상세를 작성자로 열고, 띄어쓰기 없는 긴 제목이 수정, 삭제 버튼과 겹치거나
// 화면 밖으로 넘치지 않는지 본다. 머리 줄에 간격과 min-w-0이 없으면 제목이 버튼 밑으로 들어갔다.
async page => {
  const origin = 'http://127.0.0.1:5277';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  const user = { id: 10, userId: 10, name: '검수회원', nickname: '검수회원', email: 'detail@example.invalid', provider: 'LOCAL', role: 'ROLE_USER', createdAt: '2026-09-01T00:00:00' };
  const longTitle = 'https://example.invalid/' + 'a'.repeat(120);
  const post = boardType => ({ id: 1, title: longTitle, content: '검수 본문', boardType, authorId: 10, authorName: '검수회원', imageUrls: [], createdAt: '2026-10-30T01:00:00Z' });
  let current = post('COMMUNICATION');
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/*', async route => {
    const request = route.request();
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(request.url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/') || !['xhr', 'fetch'].includes(request.resourceType())) return route.continue();
    if (path === '/api/v1/notes/stream') return route.fulfill({ status: 429, headers: { 'retry-after': '300' }, body: '' });
    if (path === '/api/v1/notes/notifications') return route.fulfill({ json: { code: 200, data: { content: [], nextCursor: null, unreadCount: 0 } } });
    if (path === '/api/v1/users/me/favorite-animal-notifications') return route.fulfill({ json: { code: 200, data: { content: [] } } });
    if (path === '/api/v1/users/me') return route.fulfill({ json: { code: 200, data: user } });
    if (path === '/api/v1/posts/read/1') return route.fulfill({ json: { code: 200, message: 'OK', data: current } });
    if (path === '/api/v1/comments/posts/read/1') return route.fulfill({ json: { code: 200, message: 'OK', data: [] } });
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });
  await page.goto(origin + '/');
  await page.evaluate(user => localStorage.setItem('auth-storage', JSON.stringify({ state: { user, accessToken: 'test-only-token' }, version: 0 })), user);
  for (const [route, boardType] of [['/community/1', 'COMMUNICATION'], ['/adoption/1', 'ADOPTION']]) {
    current = post(boardType);
    for (const width of [1920, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(origin + route);
      const heading = page.getByRole('heading', { level: 1, name: longTitle });
      await heading.waitFor();
      const edit = page.getByRole('link', { name: '수정', exact: true });
      const remove = page.getByRole('button', { name: '삭제', exact: true });
      const [title, editBox, removeBox] = await Promise.all([heading.boundingBox(), edit.boundingBox(), remove.boundingBox()]);
      const name = `${route}-${width}`;
      assert(title.x + title.width <= editBox.x, `title-left-of-buttons-${name}`);
      assert(removeBox.x + removeBox.width <= width, `buttons-inside-viewport-${name}`);
      assert(editBox.width >= 44 && removeBox.width >= 44, `buttons-not-squeezed-${name}`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no-horizontal-overflow-${name}`);
      await page.screenshot({ path: `/tmp/detail-long-title${route.replace(/\//g, '-')}-${width}.png`, animations: 'disabled' });
    }
  }
  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
