// Vite preview at 127.0.0.1:5205. All API traffic is mocked; no live account is used.
async page => {
  const origin = 'http://127.0.0.1:5205';
  const checks = [], errors = [], unexpected = [], requests = [];
  let favoriteCount = 25, registeredCount = 41, role = 'ROLE_SHELTER';
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const user = () => ({ id: 10, userId: 10, name: '테스트회원', email: 'member@example.invalid', nickname: '보호소', provider: 'LOCAL', role, careRegNo: 'test-shelter' });
  const animal = id => ({ id, breed: `동물 ${id}`, species: 'DOG', gender: 'UNKNOWN', age: 2, status: 'PROTECT', shelterId: 1, shelterName: '검증 보호소', neuterStatus: 'UNKNOWN', apmsNoticeNo: `custom-${id}`, images: [], favoriteCount: 0 });
  const onError = e => errors.push(e.message);
  const handler = async route => {
    const request = route.request();
    const relative = request.url().replace(/^https?:\/\/[^/]+/, '');
    const path = relative.split('?')[0];
    // Signed-in pages open the note stream and load note notifications; answer both so they stay out of the
    // unexpected list. A 429 with the longest accepted Retry-After (300 s) keeps reconnects rare.
    if (path === '/api/v1/notes/stream') {
      return route.fulfill({ status: 429, headers: { 'retry-after': '300' }, body: '' });
    }
    if (path === '/api/v1/users/me/favorite-animal-notifications') return route.fulfill({ json: { code: 200, data: { content: [] } } });
    if (path === '/api/v1/notes/notifications') {
      return route.fulfill({ json: { code: 200, data: { content: [], nextCursor: null, unreadCount: 0 } } });
    }
    const query = relative.split('?')[1] ?? '';
    const param = name => decodeURIComponent(query.match(new RegExp(`(?:^|&)${name}=([^&]*)`))?.[1] ?? '');
    if (!path.startsWith('/api/v1/')) return route.continue();
    requests.push(`${request.method()} ${relative}`);
    if (request.method() === 'GET') {
      if (path === '/api/v1/users/me') return route.fulfill({ json: { code: 200, data: user() } });
      if (path === '/api/v1/users/me/favorite-animals') return route.fulfill({ json: { code: 200, data: { userId: 10, totalCount: favoriteCount, favorites: Array.from({ length: favoriteCount }, (_, i) => ({ ...animal(i + 1), favoriteId: i + 1, animalId: i + 1, userId: 10, createdAt: '2026-09-01T00:00:00' })) } } });
      if (path === '/api/v1/users/me/registered-animals') {
        const number = Number(param('page'));
        assert(param('size') === '20' && param('sort') === 'createdAt,desc', 'Registered request changed');
        return route.fulfill({ json: { code: 200, data: { content: Array.from({ length: Math.max(0, Math.min(20, registeredCount - number * 20)) }, (_, i) => animal(number * 20 + i + 1)), page: number, size: 20, totalElements: registeredCount, totalPages: Math.ceil(registeredCount / 20) } } });
      }
      if (/^\/api\/v1\/animals\/\d+$/.test(path)) return route.fulfill({ json: animal(Number(path.split('/').at(-1))) });
      if (/^\/api\/v1\/animals\/\d+\/similar$/.test(path)) return route.fulfill({ json: [] });
      if (/^\/api\/v1\/favorites\/\d+\/check$/.test(path)) return route.fulfill({ json: { code: 200, data: false } });
      // The animal detail page also loads its shelter's public information.
      if (/^\/api\/v1\/shelters\/\d+$/.test(path)) return route.fulfill({ json: { id: Number(path.split('/').at(-1)), name: '모의 보호소' } });
    }
    unexpected.push(`${request.method()} ${path}`);
    return route.abort();
  };
  const tab = name => page.getByRole('button', { name, exact: true });
  const favorites = () => page.locator('aside').getByRole('button', { name: '관심 동물' });
  const registered = () => page.getByRole('button', { name: '내 보호소가 등록한 동물' });
  const profile = () => page.getByRole('button', { name: '프로필 정보' });
  const next = () => tab('다음');
  const previous = () => tab('이전');
  // Registered animals are linked cards; favorite animals became article cards with a detail link (669402f).
  const cards = () => page.locator('main').locator('article, a[href^="/animals/"]').filter({ has: page.locator('h3') });
  const names = () => cards().locator('h3').allTextContents();
  const reset = async (selected = 'profile') => {
    await page.evaluate(({ user, selected }) => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user, accessToken: 'test-only-token' }, version: 0 }));
      sessionStorage.setItem('mypageActiveTab', selected);
    }, { user: user(), selected });
    requests.length = 0;
    await page.goto(`${origin}/mypage`);
    await profile().waitFor();
  };
  page.on('pageerror', onError);
  await page.route('**/api/v1/**', handler);
  try {
    await page.goto(`${origin}/login`);
    for (const width of [1920, 390]) {
      await page.setViewportSize({ width, height: width === 1920 ? 1080 : 844 });
      for (const count of [0, 1, 12, 13, 25]) {
        favoriteCount = count;
        await reset();
        assert(!requests.some(x => /favorite-animals|registered-animals/.test(x)), 'Inactive animal tab fetched');
        const response = page.waitForResponse(r => r.url().includes('/api/v1/users/me/favorite-animals'));
        await favorites().click(); await response;
        if (count === 0) {
          await page.getByText('아직 관심 동물이 없습니다', { exact: true }).waitFor();
          assert(await cards().count() === 0 && await next().count() === 0, 'Empty favorites show pages');
        } else {
          await page.getByText(`관심 동물 ${count}마리`, { exact: true }).waitFor();
          for (let number = 0; number < Math.ceil(count / 12); number++) {
            assert(await cards().count() === Math.min(12, count - number * 12), 'Favorite page length changed');
            assert((await names())[0] === `동물 ${number * 12 + 1}`, 'Wrong favorite page');
            if (number + 1 < Math.ceil(count / 12)) await next().click();
          }
          assert(requests.filter(x => x.includes('/favorite-animals')).length === 1, 'Favorite paging made server request');
        }
        checks.push(`favorites ${count} / ${width}`);
      }
      // Keep each independent page when conditional panels unmount during tab switching.
      await profile().click();
      await favorites().click();
      assert((await names())[0] === '동물 25', 'Favorite page lost on tab switch');
      await previous().click();
      assert((await names())[0] === '동물 13', 'Favorite previous failed');
      await tab('1페이지').click();
      assert((await names())[0] === '동물 1', 'Favorite numbered page failed');
      await tab('2페이지').click();
      for (const count of [21, 41]) {
        registeredCount = count;
        await reset('registeredAnimals');
        await page.getByText(`총 ${count}마리의 동물을 등록했습니다`, { exact: true }).waitFor();
        await next().click();
        await cards().locator('h3').first().getByText('동물 21', { exact: true }).waitFor();
        await favorites().click();
        await page.getByText('관심 동물 25마리', { exact: true }).waitFor();
        await next().click();
        await registered().click();
        await page.getByText(`총 ${count}마리의 동물을 등록했습니다`, { exact: true }).waitFor();
        assert((await names())[0] === '동물 21', 'Registered page lost on tab switch');
        await favorites().click();
        assert((await names())[0] === '동물 13', 'Favorite page lost switching animal tabs');
        await registered().click();
        assert(await page.getByRole('link', { name: /새 동물 등록/ }).getAttribute('href') === '/animals/new', 'Create link changed');
        await cards().first().click();
        await page.waitForURL('**/animals/21');
        await page.getByRole('navigation', { name: '현재 위치', exact: true }).waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: `/tmp/mypage-animals-registered-detail-${width}.png`, fullPage: true, animations: 'disabled' });
        // Both return controls name the My Page tab the visitor came from.
        const breadcrumb = page.getByRole('navigation', { name: '현재 위치', exact: true });
        await breadcrumb.getByRole('button', { name: '등록한 동물', exact: true }).waitFor();
        await page.getByRole('button', { name: '등록한 동물 목록으로', exact: true }).click();
        await page.getByText(`총 ${count}마리의 동물을 등록했습니다`, { exact: true }).waitFor();
        assert((await names())[0] === '동물 1', 'Detail return baseline changed');
        checks.push(`registered ${count}, tab persistence and detail return / ${width}`);
      }
      for (const panel of ['favorites', 'registered']) {
        await (panel === 'favorites' ? favorites() : registered()).click();
        await cards().first().waitFor();
        await page.mouse.move(0, 0);
        await page.evaluate(() => document.fonts.ready);
        assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'Animal panel overflow');
        if (panel === 'favorites') {
          // Each action label stays on one line: side by side on wider screens, stacked full width on phones.
          const firstCard = cards().first();
          const detail = await firstCard.getByRole('link', { name: '상세 보기', exact: true }).boundingBox();
          const remove = await firstCard.getByRole('button', { name: '관심 동물에서 삭제', exact: true }).boundingBox();
          assert(detail.height <= 48 && remove.height <= 48, `Favorite card actions wrapped / ${width}`);
          if (width >= 640) assert(Math.abs(detail.y - remove.y) < 1 && remove.x > detail.x, `Favorite card actions not side by side / ${width}`);
          else assert(Math.abs(detail.width - remove.width) < 1 && remove.y > detail.y, `Favorite card actions not stacked / ${width}`);
        }
        await page.screenshot({ path: `/tmp/mypage-animals-${panel}-${width}.png`, fullPage: true, animations: 'disabled' });
      }
      await favorites().click();
      await cards().first().getByRole('link', { name: '상세 보기', exact: true }).click();
      await page.waitForURL('**/animals/1');
      await page.getByRole('button', { name: '관심 동물 목록으로', exact: true }).waitFor();
      // Since 669402f the detail page learns it was opened from the My Page favorites tab, for its back link.
      const routeState = await page.evaluate(() => history.state?.usr);
      assert(routeState?.from === 'mypage' && routeState?.tab === 'favoriteAnimals', 'Favorite detail route state changed');
      await page.goBack();
      await page.getByText('관심 동물 25마리', { exact: true }).waitFor();
      assert((await names())[0] === '동물 1', 'Favorite browser return baseline changed');
    }
    role = 'ROLE_USER';
    await reset('registeredAnimals');
    assert(await registered().count() === 0, 'Member sees shelter menu');
    assert(!requests.some(x => x.includes('/registered-animals')), 'Member fetched shelter animals');
    await favorites().click();
    await page.getByText('관심 동물 25마리', { exact: true }).waitFor();
    assert(errors.length === 0 && unexpected.length === 0, JSON.stringify({ errors, unexpected }));
    return { checks, memberAccess: 'pass', pageErrors: errors, unexpectedRequests: unexpected };
  } finally {
    page.off('pageerror', onError);
    await page.unroute('**/api/v1/**', handler);
  }
}
