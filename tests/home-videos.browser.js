// Browser actions are real. In connected mode, video HTTP + JWT Gateway + PostgreSQL are real.
// Only YouTube provider data (server-side), unrelated homepage APIs and external images are synthesized.
async (page, fixture) => {
  const origin = 'http://127.0.0.1:5198';
  const api = 'http://127.0.0.1:28089';
  const checks = [];
  const assert = (ok, label) => { if (!ok) throw new Error(label); checks.push(label); };
  const meta = videoId => ({ videoId, title: '함께하는 일상 ' + videoId, channelTitle: '로컬 검증 채널', thumbnailUrl: 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg', durationSeconds: 204, available: true });
  let board = { revision: 0, videos: [] };
  let failureOnce = false;
  let homeState = 'normal';
  let adminState = 'normal';
  let createRequests = 0;
  let providerFrames = 0;
  await page.addInitScript(token => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: { id: 7, role: 'ROLE_ADMIN', name: '로컬 관리자', email: 'video-test@example.invalid' }, accessToken: token, refreshToken: null }, version: 0 }));
  }, fixture.adminToken);
  await page.route('https://i.ytimg.com/**', route => route.fulfill({ path: fixture.thumbnailFile, contentType: 'image/webp' }));
  await page.route('https://www.youtube-nocookie.com/**', route => { providerFrames++; return route.fulfill({ body: '<html><head><meta charset="utf-8"></head><body>공식 플레이어 요청 경로 검증용 합성 프레임 — 실제 영상 재생 아님</body></html>', contentType: 'text/html; charset=utf-8' }); });
  await page.route(api + '/api/**', async route => {
    const req = route.request(), url = new URL(req.url()), method = req.method();
    const headers = { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'authorization,content-type,x-user-id', 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS' };
    const respond = (data, status = 200) => route.fulfill({ status, headers, json: { code: status, data, message: status === 200 ? '' : '검증용 일시 오류' } });
    if (method === 'OPTIONS') return route.fulfill({ status: 200, headers });
    const path = url.pathname;
    if (path === '/api/home/videos') {
      if (homeState === 'error') return respond(null, 503);
      if (homeState === 'empty') return respond([]);
      if (homeState === 'loading') await new Promise(resolve => setTimeout(resolve, 700));
      if (fixture.mode === 'connected') return route.continue();
      return respond(board.videos.filter(video => video.published && video.available));
    }
    if (path.startsWith('/api/admin/videos')) {
      if (method === 'GET' && adminState === 'error') return respond(null, 503);
      if (method === 'GET' && adminState === 'loading') await new Promise(resolve => setTimeout(resolve, 700));
      if (method === 'POST' && path === '/api/admin/videos') createRequests++;
      if (failureOnce && method === 'POST' && path === '/api/admin/videos') { failureOnce = false; return respond(null, 503); }
      if (fixture.mode === 'connected') return route.continue();
      if (method === 'GET') return respond(board);
      const input = req.postDataJSON();
      if (path.endsWith('/preview')) {
        if (new URL(input.url).host !== 'youtu.be') return respond(null, 400);
        return respond(meta(new URL(input.url).pathname.slice(1)));
      }
      if (input.revision !== board.revision) return respond(null, 409);
      if (method === 'POST' && path === '/api/admin/videos' && input.published && board.videos.filter(v => v.published).length >= 3) return respond(null, 409);
      if (path.endsWith('/order')) {
        board.videos.sort((a,b) => input.ids.indexOf(a.id) - input.ids.indexOf(b.id));
      } else if (path.endsWith('/publication')) {
        const video = board.videos.find(v => v.id === path.split('/')[4]); video.published = input.published;
      } else if (path.endsWith('/recheck')) {
        const video = board.videos.find(v => v.id === path.split('/')[4]); Object.assign(video, meta(video.videoId));
      } else if (method === 'POST' && path === '/api/admin/videos') {
        board.videos.push({ id: '00000000-0000-4000-8000-' + String(board.videos.length+1).padStart(12,'0'), ...meta(new URL(input.url).pathname.slice(1)), published: input.published, position: board.videos.length, createdAt: new Date().toISOString(), checkedAt: new Date().toISOString() });
      } else if (method === 'PUT') {
        const video = board.videos.find(v => v.id === path.split('/')[4]); Object.assign(video, meta(new URL(input.url).pathname.slice(1)), { published: input.published });
      }
      board.revision++; return respond(board);
    }
    // The surrounding adoption services are not part of this feature's isolated contract.
    if (path === '/api/animals') return route.fulfill({ headers, json: { content: [], totalPages: 0 } });
    if (path === '/api/v1/animals/stats/today') return route.fulfill({ headers, json: { rescuedToday: 0 } });
    if (path === '/api/v1/animals/stats/status') return route.fulfill({ headers, json: [] });
    if (path === '/api/posts') return respond([]);
    if (path.includes('/notifications')) return respond({ content: [], unreadCount: 0, nextCursor: null });
    if (path.startsWith('/api/notes')) return respond({ content: [], totalPages: 0 });
    return respond([]);
  });
  await page.goto(origin + '/admin/videos');
  await page.getByRole('heading', { name: '영상 관리', exact: true }).waitFor();
  await page.getByText('등록된 영상이 없습니다.', { exact: true }).waitFor();
  assert(true, 'admin-empty-state');
  async function register(id, fail = false) {
    await page.getByRole('button', { name: '영상 등록', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '영상 등록', exact: true });
    await dialog.getByLabel('YouTube 영상 주소').fill('https://youtu.be/' + id);
    assert(await dialog.getByRole('button', { name: '등록하기' }).isDisabled(), 'save-requires-preview-' + id);
    await dialog.getByRole('button', { name: '정보 불러오기' }).click();
    await dialog.getByText('게시 가능 · 공개 상태 · 한국에서 외부 재생 가능').waitFor();
    if (id === 'AbCdEfGhI_1') await page.screenshot({ path: '/tmp/pawbridge-video-' + fixture.mode + '-register-desktop.png', fullPage: true });
    await dialog.getByLabel('등록 후 상태').selectOption('PUBLISHED');
    if (fail) {
      failureOnce = true;
      await dialog.getByRole('button', { name: '등록하기' }).click();
      await dialog.getByRole('alert').waitFor();
      assert(await dialog.getByLabel('YouTube 영상 주소').inputValue() === 'https://youtu.be/' + id, 'failed-save-preserves-draft');
    }
    const before = createRequests;
    // Real browser events: rapid double click must still emit only one mutation.
    await dialog.getByRole('button', { name: '등록하기' }).dblclick({ delay: 10 });
    await dialog.waitFor({ state: 'hidden' });
    assert(createRequests === before+1, 'double-click-one-create-' + id);
    await page.getByRole('status').filter({ hasText: '변경 사항을 저장했습니다.' }).waitFor();
  }
  await register('AbCdEfGhI_1', true); await register('AbCdEfGhI_2'); await register('AbCdEfGhI_3');
  await page.getByRole('button', { name: '영상 등록', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: '영상 등록', exact: true });
  await dialog.getByLabel('YouTube 영상 주소').fill('https://untrusted.example/video');
  await dialog.getByRole('button', { name: '정보 불러오기' }).click();
  await dialog.getByRole('alert').waitFor();
  assert(await dialog.getByRole('button', { name: '등록하기' }).isDisabled(), 'invalid-provider-address-cannot-save');
  await dialog.getByLabel('YouTube 영상 주소').fill('https://youtu.be/AbCdEfGhI_5');
  await dialog.getByRole('button', { name: '정보 불러오기' }).click();
  await dialog.getByText('게시 가능 · 공개 상태 · 한국에서 외부 재생 가능').waitFor();
  await dialog.getByLabel('등록 후 상태').selectOption('PUBLISHED');
  await dialog.getByRole('button', { name: '등록하기' }).click();
  await dialog.getByRole('alert').waitFor();
  assert(await dialog.getByLabel('YouTube 영상 주소').inputValue() === 'https://youtu.be/AbCdEfGhI_5', 'fourth-publication-conflict-preserves-draft');
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByText('등록된 영상 3개', { exact: true }).waitFor();
  assert(true, fixture.mode === 'connected' ? 'real-db-persists-after-reload' : 'mock-list-after-reload');
  await page.screenshot({ path: '/tmp/pawbridge-video-' + fixture.mode + '-admin-desktop.png', fullPage: true });
  await page.getByLabel('영상 검색').fill('없는 검색어');
  await page.getByRole('heading', { name: '검색 결과가 없습니다.' }).waitFor(); assert(true, 'search-empty');
  await page.getByLabel('영상 검색').fill('');
  await page.getByRole('button', { name: '함께하는 일상 AbCdEfGhI_1 숨김', exact: true }).click();
  await page.getByText('홈 노출 2 / 3', { exact: true }).waitFor(); assert(true, 'hide-removes-slot');
  await page.getByLabel('게시 상태').selectOption('HIDDEN');
  assert(await page.locator('main > ul > li').count() === 1, 'status-filter');
  await page.getByLabel('게시 상태').selectOption('ALL');
  await page.getByRole('button', { name: '함께하는 일상 AbCdEfGhI_1 게시', exact: true }).click();
  await page.getByText('홈 노출 3 / 3', { exact: true }).waitFor(); assert(true, 'republish');
  await page.getByRole('button', { name: '노출 순서', exact: true }).click();
  dialog = page.getByRole('dialog', { name: '노출 순서', exact: true });
  assert(await dialog.getByRole('button', { name: '함께하는 일상 AbCdEfGhI_1 위로' }).isDisabled(), 'first-up-disabled');
  assert(await dialog.getByRole('button', { name: '함께하는 일상 AbCdEfGhI_3 아래로' }).isDisabled(), 'last-down-disabled');
  await page.screenshot({ path: '/tmp/pawbridge-video-' + fixture.mode + '-order-desktop.png', fullPage: true });
  await dialog.getByRole('button', { name: '함께하는 일상 AbCdEfGhI_2 위로' }).click();
  await dialog.getByRole('button', { name: '순서 저장' }).click(); await dialog.waitFor({ state: 'hidden' });
  assert(true, 'button-reorder-save');
  await page.getByRole('button', { name: '함께하는 일상 AbCdEfGhI_1 편집' }).click();
  dialog = page.getByRole('dialog', { name: '영상 편집' });
  await dialog.getByLabel('YouTube 영상 주소').fill('https://youtu.be/AbCdEfGhI_4');
  await dialog.getByRole('button', { name: '정보 불러오기' }).click();
  await dialog.getByText('게시 가능 · 공개 상태 · 한국에서 외부 재생 가능').waitFor();
  await dialog.getByRole('button', { name: '변경 저장' }).click(); await dialog.waitFor({ state: 'hidden' });
  await page.getByRole('heading', { name: '함께하는 일상 AbCdEfGhI_4', exact: true }).waitFor(); assert(true, 'edit-revalidates-provider-metadata');
  await page.goto(origin);
  const section = page.getByRole('region', { name: '함께하는 일상' });
  await section.getByRole('button', { name: '함께하는 일상 AbCdEfGhI_2 재생' }).waitFor();
  assert(providerFrames === 0 && await page.locator('iframe').count() === 0, 'no-player-before-explicit-action');
  assert((await section.getByRole('button').allTextContents())[0].includes('AbCdEfGhI_2'), 'home-reflects-saved-order');
  await page.screenshot({ path: '/tmp/pawbridge-video-' + fixture.mode + '-home-desktop.png', fullPage: true });
  const play = section.getByRole('button', { name: '함께하는 일상 AbCdEfGhI_2 재생' });
  await play.focus(); await page.keyboard.press('Enter');
  dialog = page.getByRole('dialog', { name: '함께하는 일상', exact: true });
  await dialog.waitFor(); assert((await dialog.locator('iframe').getAttribute('src')).includes('autoplay=0'), 'keyboard-player-no-autoplay');
  await dialog.getByRole('button', { name: '닫기' }).locator('img').evaluate(node => node.complete || new Promise(resolve => node.addEventListener('load', resolve, { once: true })));
  await page.screenshot({ path: '/tmp/pawbridge-video-' + fixture.mode + '-player-desktop.png', fullPage: true });
  const icon = dialog.getByRole('button', { name: '닫기' }).locator('img');
  const box = await icon.boundingBox(); assert(box.width === 24 && box.height === 24, 'figma-close-icon-24px');
  for (let i=0;i<8;i++) await page.keyboard.press('Tab');
  assert(await page.evaluate(() => !!document.activeElement.closest('dialog')), 'dialog-focus-trapped');
  await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
  assert(await play.evaluate(node => document.activeElement === node), 'escape-restores-play-focus');
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await section.getByRole('button', { name: / 재생$/ }).count() === 1, 'mobile-one-visible-card');
  await section.getByRole('button', { name: '다음', exact: true }).click();
  await section.getByText('2 / 3', { exact: true }).waitFor();
  assert(await section.getByRole('button', { name: '함께하는 일상 AbCdEfGhI_4 재생' }).isVisible(), 'mobile-manual-next');
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'home-no-overflow-' + width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'home-mobile-no-overflow');
  await page.screenshot({ path: '/tmp/pawbridge-video-' + fixture.mode + '-home-mobile.png', fullPage: true });
  await section.getByRole('button', { name: '함께하는 일상 AbCdEfGhI_4 재생' }).click();
  dialog = page.getByRole('dialog', { name: '함께하는 일상', exact: true });
  await dialog.waitFor();
  const playerBox = await dialog.locator('iframe').boundingBox();
  assert(playerBox.width >= 200 && playerBox.height >= 200, 'mobile-player-minimum-viewport');
  await dialog.getByRole('button', { name: '닫기' }).locator('img').evaluate(node => node.complete || new Promise(resolve => node.addEventListener('load', resolve, { once: true })));
  await page.screenshot({ path: '/tmp/pawbridge-video-' + fixture.mode + '-player-mobile.png', fullPage: true });
  await page.keyboard.press('Escape');
  await page.goto(origin + '/admin/videos');
  await page.getByText('등록된 영상 3개', { exact: true }).waitFor();
  await page.getByRole('button', { name: '영상 등록', exact: true }).click();
  dialog = page.getByRole('dialog', { name: '영상 등록' });
  const bounds = await dialog.boundingBox();
  assert(bounds.x === 0 && bounds.y === 0 && bounds.width === 390 && bounds.height === 844, 'mobile-registration-full-screen');
  assert(await dialog.getByRole('button', { name: '닫기' }).isVisible(), 'mobile-dialog-close-visible');
  await dialog.getByRole('button', { name: '닫기' }).locator('img').evaluate(node => node.complete || new Promise(resolve => node.addEventListener('load', resolve, { once: true })));
  await page.screenshot({ path: '/tmp/pawbridge-video-' + fixture.mode + '-register-mobile.png', fullPage: true });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '노출 순서', exact: true }).click();
  dialog = page.getByRole('dialog', { name: '노출 순서' });
  assert(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth), 'mobile-order-no-overflow');
  await page.screenshot({ path: '/tmp/pawbridge-video-' + fixture.mode + '-order-mobile.png', fullPage: true });
  await page.keyboard.press('Escape');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'admin-mobile-no-overflow');
  await page.screenshot({ path: '/tmp/pawbridge-video-' + fixture.mode + '-admin-mobile.png', fullPage: true });
  homeState = 'loading'; await page.goto(origin);
  await page.getByRole('status', { name: '영상을 불러오고 있어요.' }).waitFor(); assert(true, 'home-local-skeleton');
  await page.getByRole('region', { name: '함께하는 일상' }).getByRole('button', { name: / 재생$/ }).first().waitFor();
  for (const state of ['empty', 'error']) {
    homeState = state; await page.reload();
    await page.getByRole('heading', { name: '가족이 된 이후의 이야기', exact: true }).waitFor();
    await page.waitForTimeout(300);
    assert(await page.getByRole('region', { name: '함께하는 일상' }).count() === 0, 'home-' + state + '-does-not-block-adoption');
  }
  if (fixture.mode === 'mock') {
    board.videos[0].available = false; board.videos[0].title = null; board.revision++;
    await page.goto(origin + '/admin/videos');
    await page.getByRole('button', { name: 'AbCdEfGhI_2 재확인' }).click();
    await page.getByRole('heading', { name: '함께하는 일상 AbCdEfGhI_2', exact: true }).waitFor();
    assert(true, 'unavailable-admin-recheck-restores-metadata');
    board.videos[0].title = '긴 제목 확인 '.repeat(45);
    await page.route('https://i.ytimg.com/**', route => route.abort());
    await page.reload();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'long-title-and-image-failure-no-overflow');
  }
  adminState = 'loading';
  await page.goto(origin + '/admin/videos');
  await page.getByText('영상 목록을 불러오는 중입니다.', { exact: true }).waitFor();
  assert(true, 'admin-loading-state');
  await page.getByRole('heading', { name: '영상 관리', exact: true }).waitFor();
  await page.getByText('등록된 영상 3개', { exact: true }).waitFor();
  adminState = 'error'; await page.reload();
  await page.getByRole('heading', { name: '영상 목록을 불러오지 못했습니다.', exact: true }).waitFor();
  assert(true, 'admin-error-state');
  adminState = 'normal';
  await page.getByRole('button', { name: '다시 불러오기', exact: true }).click();
  await page.getByText('등록된 영상 3개', { exact: true }).waitFor();
  assert(true, 'admin-error-retry-recovers');
  await page.getByRole('heading', { name: '영상 관리', exact: true }).waitFor();
  await page.evaluate(() => window.useAuthStore.getState().clearAuth());
  await page.getByText('로그인이 필요합니다', { exact: true }).waitFor(); assert(true, 'anonymous-admin-ui-blocked');
  await page.evaluate(token => window.useAuthStore.getState().setAuth({ id: 8, role: 'ROLE_USER', name: '로컬 일반회원', email: 'video-user@example.invalid' }, token, ''), fixture.userToken);
  await page.getByText('접근 권한이 없습니다', { exact: true }).waitFor(); assert(true, 'ordinary-member-admin-ui-blocked');
  return { mode: fixture.mode, checks, screenshots: '/tmp/pawbridge-video-' + fixture.mode + '-*.png',
    exclusions: ['production', 'real YouTube key and playback', 'User login issuance', 'unrelated adoption services'] };
}
