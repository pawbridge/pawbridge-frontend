// Site header bell on mocked data: favorite animal status changes join the note alerts. Death reasons are not shown,
// the count clears once the panel is opened and stays cleared after a reload, and a failed read offers a retry.
async page => {
  const origin = 'http://127.0.0.1:5273';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  const user = { id: 97, userId: 97, name: '관심회원', nickname: '관심회원', email: 'member@example.invalid', provider: 'GOOGLE', role: 'ROLE_USER', createdAt: '2026-09-01T00:00:00' };
  const change = (animalId, status, changedAt, breed) => ({
    animalId, status, previousStatus: 'PROTECT', changedAt, species: 'DOG', breed,
    imageUrl: null, apmsNoticeNo: `경기-수원-2026-0${animalId}`, shelterName: '합성 보호소',
  });
  let favorites = [
    change(31, 'ADOPTED', '2026-11-02T03:00:00Z', '믹스견'),
    change(32, 'EUTHANIZED', '2026-11-01T03:00:00Z', '진도견'),
  ];
  let failFavorites = false;
  let favoriteReads = 0;
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/*', async route => {
    const request = route.request();
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(request.url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/')) return route.continue();
    if (path === '/api/v1/notes/stream') return route.fulfill({ status: 429, body: '' });
    if (path === '/api/v1/notes/notifications') return route.fulfill({ json: { data: { content: [], nextCursor: null, unreadCount: 0 } } });
    if (path === '/api/v1/users/me') return route.fulfill({ json: { code: 200, data: user } });
    if (path === '/api/v1/users/me/favorite-animal-notifications') {
      favoriteReads += 1;
      if (failFavorites) return route.fulfill({ status: 503, json: { code: 503 } });
      return route.fulfill({ json: { code: 200, data: { content: favorites } } });
    }
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });
  await page.goto(origin + '/terms');
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem('auth-storage', value);
  }, JSON.stringify({ state: { user, accessToken: 'test-only-token', refreshToken: null }, version: 0 }));
  const bell = () => page.getByRole('button', { name: /^알림,/ });
  const label = () => bell().getAttribute('aria-label');
  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => localStorage.removeItem('pawbridge:favorite-notifications-seen:97'));
    await page.goto(origin + '/');
    await page.waitForFunction(() => /관심 동물 새 소식 2개/.test(document.querySelector('[aria-controls="private-note-notifications"]')?.getAttribute('aria-label') ?? ''));
    assert((await bell().innerText()).trim() === '2', `${width}-badge-counts-favorites`);
    await bell().click();
    const section = page.getByRole('region', { name: '관심 동물 알림' });
    await section.waitFor();
    assert(await page.getByRole('heading', { level: 2, name: '알림' }).count() === 1, `${width}-panel-title`);
    const adopted = section.getByRole('link', { name: /믹스견/ });
    assert(await adopted.getAttribute('href') === '/animals/31', `${width}-links-animal`);
    assert((await adopted.innerText()).includes('입양됐어요'), `${width}-adopted-phrase`);
    const ended = section.getByRole('link', { name: /진도견/ });
    assert((await ended.innerText()).includes('보호가 종료되었어요'), `${width}-death-as-ended`);
    assert(!(await section.innerText()).includes('안락사'), `${width}-no-death-reason`);
    const box = await page.locator('#private-note-notifications').boundingBox();
    assert(box && box.x >= 0 && box.x + box.width <= width, `${width}-panel-inside-viewport`);
    await page.screenshot({ path: `/tmp/pawbridge-favorite-notifications-${width}.png` });
    // Opening the panel marks what was shown as seen, also after a reload.
    assert(/관심 동물 새 소식 0개/.test(await label()), `${width}-opened-clears-count`);
    await page.keyboard.press('Escape');
    await page.reload();
    await bell().waitFor();
    await page.waitForFunction(() => /관심 동물 새 소식 0개/.test(document.querySelector('[aria-controls="private-note-notifications"]')?.getAttribute('aria-label') ?? ''));
    assert((await bell().innerText()).trim() === '', `${width}-seen-survives-reload`);
  }
  // A newer change after the last look counts again.
  favorites = [change(33, 'ADOPTION_PENDING', '2026-11-03T03:00:00Z', '푸들'), ...favorites];
  await page.reload();
  await page.waitForFunction(() => /관심 동물 새 소식 1개/.test(document.querySelector('[aria-controls="private-note-notifications"]')?.getAttribute('aria-label') ?? ''));
  assert((await bell().innerText()).trim() === '1', 'newer-change-counts');
  // A failed read shows a retry inside the panel instead of an empty section.
  failFavorites = true;
  await page.reload();
  await bell().click();
  const failed = page.getByRole('region', { name: '관심 동물 알림' });
  await failed.getByText('관심 동물 소식을 불러오지 못했어요.').waitFor();
  failFavorites = false;
  const before = favoriteReads;
  await failed.getByRole('button', { name: '다시 시도' }).click();
  await failed.getByRole('link', { name: /푸들/ }).waitFor();
  assert(favoriteReads > before, 'retry-reads-again');
  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
