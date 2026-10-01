// Run a local Vite preview on 127.0.0.1:15174, then use playwright-cli run-code --filename=tests/animal-report-search.browser.js.
// All API requests and credentials are local mocks. This is not a production integration test.
async page => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.evaluate(() => localStorage.removeItem('auth-storage'));
  const errors = [];
  const calls = [];
  page.on('pageerror', error => errors.push(error.message));
  const fixture = { reportId: 900001, authorId: 101, authorNickname: '검증 회원', kind: 'MISSING',
    title: '실종 · 서울 마포구 · 개', description: '파란 목줄을 한 갈색 강아지를 찾습니다.',
    occurredOn: '2026-09-30', approximateTime: '오후', region: '서울 마포구 상암동', species: '개',
    province: '서울특별시', district: '마포구', animalType: 'DOG', imageUrls: [],
    createdAt: '2026-10-01T00:00:00', updatedAt: '2026-10-01T00:00:00' };
  let mode = 'ok';
  await page.unroute('**/api/**');
  await page.unroute('http://127.0.0.1:15174/api/**');
  await page.route('http://127.0.0.1:15174/api/**', async route => {
    const request = route.request();
    const [pathname, query = ''] = request.url().split('?');
    const params = Object.fromEntries(query.split('&').filter(Boolean).map(pair => pair.split('=').map(value => decodeURIComponent(value.replace(/\+/g, ' ')))));
    if (pathname.endsWith('/api/reports') && request.method() === 'GET') {
      calls.push(params);
      if (mode === 'error') return route.fulfill({ status: 503, json: { message: '격리 모의 오류' } });
      if (mode === 'loading') await page.waitForTimeout(1500);
      return route.fulfill({ json: { data: { content: mode === 'empty' ? [] : [{ ...fixture, kind: params.kind }],
        totalPages: mode === 'empty' ? 0 : 3 } } });
    }
    if (pathname.endsWith('/api/reports') && request.method() === 'POST') {
      const body = request.postData();
      for (const expected of ['"province":"서울특별시"', '"district":"마포구"', '"animalType":"DOG"', '"species":"푸들"']) {
        if (!body.includes(expected)) throw new Error('등록 요청에서 구조화 필드 누락: ' + expected);
      }
      calls.push({ write: 'local-mock-only' });
      return route.fulfill({ json: { data: fixture } });
    }
    if (pathname.endsWith('/api/reports/900001')) return route.fulfill({ json: { data: fixture } });
    return route.fulfill({ json: { data: [] } });
  });
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const param = async name => page.evaluate(name => new URLSearchParams(location.search).get(name), name);
  await page.goto('http://127.0.0.1:15174/reports/missing');
  await page.getByRole('heading', { name: fixture.title, exact: true }).waitFor();
  const search = page.getByRole('search', { name: '제보 검색' });
  await search.getByRole('combobox', { name: '시·도', exact: true }).selectOption('서울특별시');
  await search.getByRole('combobox', { name: '시·군·구', exact: true }).selectOption('마포구');
  await search.getByRole('combobox', { name: '동물 종류', exact: true }).selectOption('DOG');
  await search.getByRole('combobox', { name: '시·도', exact: true }).focus();
  await page.keyboard.press('Tab');
  check(await search.getByRole('combobox', { name: '시·군·구', exact: true }).evaluate(el => el === document.activeElement), '키보드 지역 이동 실패');
  await search.getByRole('button', { name: '최근 7일', exact: true }).click();
  await search.getByRole('searchbox').fill('파란 목줄');
  const filteredResponse = page.waitForResponse(response => response.url().startsWith('http://127.0.0.1:15174/api/reports?')
    && response.url().includes('animalType=DOG') && response.url().includes('district='));
  await search.getByRole('button', { name: '검색', exact: true }).click();
  await filteredResponse;
  await page.waitForURL('**/reports/missing?**');
  await page.waitForFunction(() => location.search.includes('animalType=DOG'));
  await page.getByRole('heading', { name: fixture.title, exact: true }).waitFor();
  check(await param('district') === '마포구', '지역 URL 누락');
  check(calls.some(call => call.province === '서울특별시' && call.district === '마포구'
    && call.animalType === 'DOG' && call.keyword === '파란 목줄' && call.from && call.to
    && call.page === '0' && call.kind === 'MISSING'), '실제 API 필터 파라미터 누락');
  await page.screenshot({ path: '/tmp/pawbridge-report-search-desktop.png', fullPage: true });
  await page.getByRole('button', { name: '2페이지', exact: true }).click();
  await page.waitForURL('**page=2');
  check(await param('animalType') === 'DOG', '페이지 변경 시 필터 유실');
  await page.getByRole('navigation', { name: '제보 종류' }).getByRole('link', { name: '목격 제보', exact: true }).click();
  await page.waitForURL('**/reports/sightings?**');
  check(await param('page') === null, '탭 변경 시 페이지 미초기화');
  check(await param('district') === '마포구', '탭 변경 시 필터 유실');
  await page.goBack();
  await page.waitForURL('**page=2');
  check(await search.getByRole('combobox', { name: '동물 종류', exact: true }).inputValue() === 'DOG', '뒤로 가기 필터 불일치');
  await search.getByRole('combobox', { name: '시·도', exact: true }).selectOption('부산광역시');
  check(await search.getByRole('combobox', { name: '시·군·구', exact: true }).inputValue() === '', '시도 변경 시 이전 구 남음');
  await search.getByRole('button', { name: '직접 선택', exact: true }).click();
  await search.getByLabel('시작일').fill('2026-09-01');
  await search.getByLabel('종료일').fill('2026-09-30');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '/tmp/pawbridge-report-search-mobile-custom.png', fullPage: true });
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '모바일 가로 넘침');
  await search.getByRole('button', { name: '검색', exact: true }).click();
  await page.waitForFunction(() => new URLSearchParams(location.search).get('from') === '2026-09-01');
  await search.getByRole('button', { name: '초기화', exact: true }).click();
  await page.waitForURL('http://127.0.0.1:15174/reports/missing');
  check(await search.getByRole('combobox', { name: '동물 종류', exact: true }).inputValue() === '', '초기화 실패');
  mode = 'empty'; await page.reload();
  await page.getByText('아직 등록된 제보가 없습니다.', { exact: true }).waitFor();
  mode = 'error'; await page.reload();
  await page.getByText('제보를 불러오지 못했습니다.', { exact: true }).waitFor();
  mode = 'loading';
  await page.getByRole('button', { name: '다시 시도', exact: true }).click();
  await page.getByText('제보를 불러오는 중입니다.', { exact: true }).waitFor();
  await page.getByRole('heading', { name: fixture.title, exact: true }).waitFor();
  mode = 'ok';
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.getByRole('button', { name: '실종동물 찾기', exact: true }).click();
  check(!(await page.locator('header').innerText()).includes('현재 페이지'), '내비게이션 문구 잔존');
  check(await page.locator('header a[aria-current="page"]').count() > 0, '현재 메뉴 접근성 표시 유실');
  await page.screenshot({ path: '/tmp/pawbridge-report-search-navigation.png', fullPage: true });
  await page.evaluate(() => localStorage.setItem('auth-storage', JSON.stringify({
    state: { user: { id: 101, name: '검증 회원', nickname: '검증 회원', role: 'ROLE_USER' }, accessToken: 'local-mock-only', refreshToken: 'local-mock-only' }, version: 0
  })));
  await page.goto('http://127.0.0.1:15174/reports/new?kind=MISSING');
  await page.getByRole('heading', { name: '실종 동물 알리기', exact: true }).waitFor();
  await page.getByRole('combobox', { name: '시·도 *', exact: true }).selectOption('서울특별시');
  await page.getByRole('combobox', { name: '시·군·구 (선택)', exact: true }).selectOption('마포구');
  await page.getByRole('combobox', { name: '동물 종류 *', exact: true }).selectOption('DOG');
  await page.getByLabel(/^날짜/).fill('2026-09-30');
  await page.getByLabel(/^지역 설명/).fill('서울 마포구 상암동');
  await page.getByLabel('품종·세부 종류 (선택)', { exact: true }).fill('푸들');
  const description = page.locator('textarea').last();
  await description.fill(fixture.description);
  await page.getByRole('checkbox').check();
  await page.screenshot({ path: '/tmp/pawbridge-report-search-register.png', fullPage: true });
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL('**/reports/900001');
  check(calls.some(call => call.write === 'local-mock-only'), '모의 등록 미실행');
  check(errors.length === 0, '브라우저 런타임 오류: ' + errors.join(', '));
  return { result: 'PASS', scope: 'local mock API; not production integration', requestCount: calls.length, lastFilters: calls.filter(call => !call.write).slice(-2), checks: ['API parameters', 'page/tabs/back', 'province reset', 'custom date', 'reset', 'mobile overflow', 'empty/error/loading/retry', 'navigation aria-current', 'classified multipart registration'] };
}
