// Run with playwright-cli run-code --filename=tests/animal-report-navigation.browser.js.
// Preview localhost:5198. All APIs, login and writes are mocked; never uses production credentials.
async page => {
  const origin = 'http://127.0.0.1:5198';
  const checks = [], errors = [], requests = [], writes = [];
  const check = (value, message) => { if (!value) throw new Error(message); };
  const onError = error => errors.push(error.message);
  const profile = { id: 901, name: '검증회원', email: 'member@example.invalid', role: 'ROLE_USER', createdAt: '2026-09-30T00:00:00' };
  const base = { reportId: 42, authorId: 901, authorNickname: '검증회원', kind: 'MISSING', occurredOn: '2026-09-28', approximateTime: null, region: '서울 마포구', landmark: '공원 입구', species: '개', animalName: '콩이', coatColor: '흰색', animalSize: '소형', distinguishingFeatures: '파란 목줄', direction: null, description: '보호자가 등록한 실종 동물 정보입니다.', title: '파란 목줄을 한 콩이를 찾습니다', imageUrls: [origin + '/__test-photo'], createdAt: '2026-09-30T10:00:00', updatedAt: '2026-09-30T10:00:00' };
  Object.assign(base, { province: '서울특별시', district: '마포구', animalType: 'DOG' });
  let failure = false, resume = null;
  const handler = async route => {
    const request = route.request(), path = request.url().replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    if (!path.startsWith('/api/')) return route.continue();
    const params = Object.fromEntries((request.url().split('?')[1] || '').split('&').filter(Boolean).map(pair => pair.split('=').map(value => decodeURIComponent(value.replace(/\+/g, ' ')))));
    if (path === '/api/auth/login') {
      writes.push(path);
      return route.fulfill({ json: { code: 200, data: { ...profile, userId: profile.id, accessToken: 'test-only-token', refreshToken: 'test-only-refresh' } } });
    }
    if (path === '/api/reports' && request.method() === 'GET') {
      requests.push(params);
      if (failure) return route.fulfill({ status: 503, json: { message: 'test-only-unavailable' } });
      if (params.keyword === 'loading') await new Promise(resolve => { resume = resolve; });
      const kind = params.kind;
      const rows = [base, { ...base, reportId: 43, imageUrls: [], title: '아주 긴 동물의 특징을 포함한 제보 제목 '.repeat(8) }, { ...base, reportId: 44, imageUrls: [origin + '/__broken-photo'], title: '갈색 동물의 목격 정보를 확인해 주세요' }].map(report => ({ ...report, kind }));
      return route.fulfill({ json: { data: { content: params.keyword === 'empty' ? [] : rows, totalPages: 3 } } });
    }
    if (/^\/api\/reports(?:\/\d+)?$/.test(path)) {
      if (request.method() !== 'GET') writes.push(`${request.method()} ${path}`);
      return route.fulfill({ json: { data: base } });
    }
    if (request.method() !== 'GET') throw new Error('Unexpected write: ' + path);
    if (path === '/api/users/me') return route.fulfill({ json: { code: 200, data: profile } });
    if (path.includes('/posts')) return route.fulfill({ json: { code: 200, data: [] } });
    if (path.endsWith('/stats/today')) return route.fulfill({ json: { rescuedToday: 0 } });
    return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, items: [] } });
  };
  const resetAuth = async user => {
    await page.evaluate(user => {
      localStorage.clear(); sessionStorage.clear();
      if (user) localStorage.setItem('auth-storage', JSON.stringify({ state: { user, accessToken: 'test-only-token', refreshToken: 'test-only-refresh' }, version: 0 }));
    }, user);
  };
  const waitCards = () => page.locator('main a[href="/reports/42"]').waitFor();
  page.on('pageerror', onError);
  // The CLI stops a command at native dialogs. Suppress only alert in this local
  // test context so OAuth completion and all subsequent assertions finish together.
  await page.addInitScript(() => { window.alert = () => {}; window.confirm = () => true; });
  await page.route('**/api/**', handler);
  await page.route('**/__test-photo', route => route.fulfill({ path: 'tests/fixtures/lost-search.png', contentType: 'image/png' }));
  await page.route('**/__broken-photo', route => route.fulfill({ status: 404, body: '' }));
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin + '/reports/missing'); await resetAuth(null); await page.reload(); await waitCards();
    const desktop = page.getByRole('navigation', { name: '주 메뉴', exact: true });
    const lost = desktop.getByRole('button', { name: '실종동물 찾기', exact: true });
    const protectedButton = desktop.getByRole('button', { name: '보호동물', exact: true });
    check(await lost.getAttribute('aria-current') === 'page', 'Lost group must identify current section');
    await page.mouse.move(0, 900);
    const style = await lost.evaluate(el => ({ bg: getComputedStyle(el).backgroundColor, weight: getComputedStyle(el).fontWeight }));
    check(style.bg === 'rgb(255, 242, 166)' && style.weight === '700', 'Approved active pill styling missing');
    await lost.click();
    const panel = page.locator('#lost-animal-navigation'); await panel.waitFor();
    const links = panel.getByRole('link');
    check(await links.count() === 3, 'Lost section needs three destinations');
    check(await links.nth(0).getAttribute('href') === '/reports/missing', 'Missing destination');
    check(await links.nth(1).getAttribute('href') === '/reports/sightings', 'Sighting destination');
    check(await links.nth(2).getAttribute('href') === '/animals/lost', 'Photo search path changed');
    await protectedButton.hover(); await page.locator('#protected-animal-navigation').waitFor();
    await panel.waitFor({ state: 'hidden' });
    check(await lost.getAttribute('aria-current') === 'page' && !await protectedButton.getAttribute('aria-current'), 'Open group must not replace current group');
    await page.keyboard.press('Escape');
    checks.push('current pill, independent disclosure state, exclusive panels, three destinations');

    const main = page.locator('main');
    check(await main.locator('a[href^="/reports/"]').filter({ has: page.locator('h3') }).count() === 3, 'Three report cards expected');
    await main.getByText('사진이 등록되지 않았어요', { exact: true }).waitFor();
    await main.getByText('사진을 불러오지 못했어요', { exact: true }).waitFor();
    check(await main.getByText('실종일: 2026-09-28', { exact: true }).count() === 3, 'Event day must be distinguished from registration day');
    const pageResponse = page.waitForResponse(response => response.url().includes('/api/reports?') && response.url().includes('page=1'));
    await main.getByRole('button', { name: '2페이지', exact: true }).click(); await pageResponse;
    await page.waitForURL(origin + '/reports/missing?page=2'); await waitCards();
    check(await page.evaluate(() => new URL(location.href).searchParams.get('page')) === '2', 'Page selection missing in URL');
    await main.getByRole('searchbox', { name: '특징·지역 키워드' }).fill('흰색');
    const searchResponse = page.waitForResponse(response => response.url().includes('/api/reports?') && response.url().includes('keyword=' + encodeURIComponent('흰색')));
    await main.getByRole('button', { name: '검색', exact: true }).click(); await searchResponse; await waitCards();
    check(!await page.evaluate(() => new URL(location.href).searchParams.has('page')), 'Search must reset page');
    check(requests.some(p => p.kind === 'MISSING' && p.keyword === '흰색' && p.page === '0' && p.size === '12'), 'API search contract');
    await page.reload(); await waitCards();
    check(await main.getByRole('searchbox').inputValue() === '흰색', 'Reload must retain search');
    await main.getByRole('navigation', { name: '제보 종류' }).getByRole('link', { name: '목격 제보', exact: true }).click(); await waitCards();
    check(page.url().includes('/reports/sightings?keyword='), 'Type switching must retain search');
    await main.getByText('목격일: 2026-09-28', { exact: true }).first().waitFor();
    await page.goBack(); await waitCards();
    check(page.url().includes('/reports/missing?keyword='), 'History must restore report type');
    await main.getByRole('button', { name: '초기화', exact: true }).click(); await waitCards();
    check(page.url() === origin + '/reports/missing', 'Reset must clear URL');
    checks.push('photo/fallback cards, event vs registration date, API keyword/page, reset/reload/history');

    await page.goto(origin + '/reports/sightings?keyword=empty');
    await main.getByText('검색 조건에 맞는 제보가 없습니다.', { exact: true }).waitFor();
    check(await page.locator('footer').count() === 1, 'Empty page footer missing');
    failure = true; await page.goto(origin + '/reports/missing?keyword=error');
    await main.getByRole('alert').waitFor();
    failure = false; await main.getByRole('button', { name: '다시 시도' }).click(); await waitCards();
    await page.goto(origin + '/reports/missing?keyword=loading');
    await main.getByText('제보를 불러오는 중입니다.', { exact: true }).waitFor();
    check(await page.locator('footer').count() === 1, 'Loading page footer missing');
    resume(); await waitCards();
    checks.push('empty, loading, error and retry preserve page shell');

    await page.goto(origin + '/community/reports/42');
    await page.waitForURL(origin + '/reports/42'); await main.getByRole('heading', { name: base.title }).waitFor();
    await main.getByRole('link', { name: '목록으로', exact: true }).click(); await waitCards();
    await page.goto(origin + '/community/reports/new?kind=SIGHTING');
    await page.waitForURL(origin + '/reports/new?kind=SIGHTING');
    await page.getByRole('link', { name: '로그인', exact: true }).click();
    await page.getByPlaceholder('이메일 주소를 입력하세요').fill(profile.email);
    await page.getByPlaceholder('비밀번호를 입력하세요', { exact: true }).fill('test-only-password');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await page.waitForURL(origin + '/reports/new?kind=SIGHTING');
    await main.getByRole('heading', { name: '목격 제보하기', exact: true }).waitFor();
    await main.getByRole('link', { name: '취소', exact: true }).click(); await page.waitForURL(origin + '/reports/sightings'); await waitCards();
    await page.goto(origin + '/community/reports/42/edit');
    await page.waitForURL(origin + '/reports/42/edit'); await main.getByRole('heading', { name: '제보 수정', exact: true }).waitFor();
    await main.getByRole('link', { name: '취소', exact: true }).click(); await waitCards();
    checks.push('legacy detail/new/edit, guest write gate, password login returns kind, cancel list');

    await resetAuth(null);
    const jwt = await page.evaluate(user => 'test.' + btoa(JSON.stringify({ userId: user.id, sub: user.email, name: 'Test Member', role: 'ROLE_USER' })) + '.test', profile);
    await page.evaluate(() => sessionStorage.setItem('pawbridge-report-login-return', '/reports/new?kind=MISSING'));
    await page.goto(origin + '/oauth/callback?accessToken=' + encodeURIComponent(jwt) + '&refreshToken=test-only-refresh');
    await page.waitForURL(origin + '/reports/new?kind=MISSING');
    await main.getByRole('heading', { name: '실종 동물 알리기', exact: true }).waitFor();
    check(await page.evaluate(() => sessionStorage.getItem('pawbridge-report-login-return')) === null, 'OAuth destination must be consumed once');
    checks.push('OAuth callback return with synthetic test tokens only');

    await main.getByLabel(/^날짜/).fill(base.occurredOn);
    await main.getByLabel(/^지역/).fill(base.region);
    await main.getByRole('combobox', { name: '시·도 *', exact: true }).selectOption(base.province);
    await main.getByRole('combobox', { name: '시·군·구 (선택)', exact: true }).selectOption(base.district);
    await main.getByRole('combobox', { name: '동물 종류 *', exact: true }).selectOption(base.animalType);
    await main.getByLabel(/^품종·세부 종류/).fill(base.species);
    await main.getByLabel(/^상황 설명/).fill(base.description);
    await main.getByRole('checkbox', { name: '공개되는 내용을 확인했습니다.' }).check();
    await main.getByRole('button', { name: '제보 등록', exact: true }).click();
    await page.waitForURL(origin + '/reports/42'); await main.getByRole('heading', { name: base.title }).waitFor();
    await main.getByRole('link', { name: '수정', exact: true }).click();
    await main.getByRole('heading', { name: '제보 수정', exact: true }).waitFor();
    await main.getByLabel(/^상황 설명/).fill('수정한 테스트 설명입니다.');
    await main.getByRole('checkbox', { name: '공개되는 내용을 확인했습니다.' }).check();
    await main.getByRole('button', { name: '수정 완료', exact: true }).click();
    await page.waitForURL(origin + '/reports/42');
    await main.getByRole('button', { name: '삭제', exact: true }).click();
    await page.waitForURL(origin + '/reports/missing'); await waitCards();
    checks.push('mocked create/update return to dedicated detail and delete returns to kind list');

    await resetAuth(null);
    for (const width of [1920, 1440, 1280, 1024, 768, 390, 375, 320]) {
      await page.setViewportSize({ width, height: width >= 1280 ? 1000 : 844 });
      await page.goto(origin + '/reports/missing'); await waitCards();
      check(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'Horizontal overflow ' + width);
      if (width < 1280) {
        await page.getByRole('button', { name: '메뉴 열기', exact: true }).click();
        const mobile = page.getByRole('navigation', { name: '모바일 메뉴', exact: true });
        check(await mobile.locator('#lost-animal-mobile-navigation a').count() === 3, 'Mobile lost destinations');
        const current = mobile.locator('#lost-animal-mobile-navigation a[aria-current="page"]');
        check(await current.count() === 1, 'Mobile current destination');
        for (const link of await mobile.locator('#lost-animal-mobile-navigation a').all()) check((await link.boundingBox()).height >= 44, 'Mobile touch target');
        if (width === 390) await page.screenshot({ path: '/tmp/pawbridge-report-nav-v14-mobile-menu.png', fullPage: true });
        await page.keyboard.press('Escape'); await mobile.waitFor({ state: 'hidden' });
      }
      if ([1920, 390].includes(width)) await page.screenshot({ path: `/tmp/pawbridge-report-nav-v14-${width}.png`, fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin + '/reports/missing'); await waitCards();
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.mouse.move(0, 900);
    const darkCurrent = await lost.evaluate(el => ({ color: getComputedStyle(el).color, bg: getComputedStyle(el).backgroundColor }));
    check(darkCurrent.color === 'rgb(48, 48, 46)' && darkCurrent.bg === 'rgb(255, 242, 166)', 'Dark active menu contrast');
    await page.screenshot({ path: '/tmp/pawbridge-report-nav-v14-dark.png', fullPage: true });
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    checks.push('dark mode active menu foreground/background');
    await page.goto(origin + '/community');
    await main.getByRole('heading', { name: '커뮤니티', exact: true }).waitFor();
    check(await main.getByRole('button', { name: '실종 알림', exact: true }).count() === 0, 'Report tabs remain in community');
    await main.getByRole('link', { name: '실종동물 찾기', exact: true }).waitFor();
    checks.push('eight responsive widths, mobile group/current/touch/escape, community separation');
    check(errors.length === 0, errors.join('\n'));
    check(JSON.stringify(writes) === JSON.stringify(['/api/auth/login', 'POST /api/reports', 'PUT /api/reports/42', 'DELETE /api/reports/42']), 'Unexpected mutation traffic');
    return { checks, apiRequests: requests.length, mockedWrites: writes, pageErrors: errors, scope: 'local build with mocked APIs, not production integration' };
  } finally {
    page.off('pageerror', onError);
    await page.unroute('**/api/**', handler);
    await page.unroute('**/__test-photo'); await page.unroute('**/__broken-photo');
  }
}
