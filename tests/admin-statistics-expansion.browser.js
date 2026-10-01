// Local UI contracts only. All API traffic is intercepted; no live auth or DB.
async page => {
  const origin = 'http://127.0.0.1:5202';
  const check = (condition, label) => { if (!condition) throw new Error(label); };
  const results = [];
  const requests = [];
  const errors = [];
  let mode = 'normal';
  let release;
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  await page.unroute('**/api/**');
  const envelope = data => ({ code: 200, data });
  await page.route('**/api/**', async route => {
    const request = route.request();
    if (!['xhr', 'fetch'].includes(request.resourceType())) return route.continue();
    const path = request.url().replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    const params = Object.fromEntries((request.url().split('?')[1] || '').split('&').filter(Boolean).map(item => item.split('=').map(decodeURIComponent)));
    check(request.method() === 'GET', 'Statistics must not issue mutations');
    requests.push({ path, params });
    if (mode === 'error' && /intake-trend|daily-signups|shelter-applications\/stats|posts\/stats\/period/.test(path)
        || mode === 'partial' && path.endsWith('/total-users')) return route.fulfill({ status: 500, json: { message: 'mock-only failure' } });
    if (mode === 'loading' && path.endsWith('/intake-trend')) await new Promise(resolve => { release = resolve; });
    const daily = [];
    if (params.startDate && mode !== 'zero') {
      for (let date = new Date(params.startDate + 'T00:00:00Z'), index = 0; date.toISOString().slice(0, 10) <= params.endDate; date.setUTCDate(date.getUTCDate() + 1), index++) {
        if (index % 3 !== 1) daily.push({ date: date.toISOString().slice(0, 10), count: index === 0 ? 5 : 3 });
      }
    }
    const total = daily.reduce((sum, row) => sum + row.count, 0);
    const trend = { startDate: params.startDate, endDate: params.endDate, daily, previousDayCount: mode === 'zero' ? 0 : 10 };
    let body;
    if (path.endsWith('/intake-trend')) body = trend;
    else if (path.endsWith('/daily-animals')) body = daily;
    else if (path.endsWith('/daily-signups')) body = envelope(daily);
    else if (path.endsWith('/total-users')) body = envelope(1280);
    else if (path === '/api/shelters/count') body = 363;
    else if (path.endsWith('/shelter-applications/stats')) body = envelope({ ...trend, currentPending: mode === 'zero' ? 0 : 5, approvedCount: mode === 'zero' ? 0 : 8, rejectedCount: mode === 'zero' ? 0 : 2 });
    else if (path.endsWith('/posts/stats/period')) body = envelope({ ...trend, byBoardType: mode === 'zero' ? [] : [{ boardType: 'ADOPTION', count: 4 }, { boardType: 'COMMUNICATION', count: total - 4 }] });
    else if (path.endsWith('/animals/stats/status')) body = mode === 'zero' ? [] : [{ status: 'PROTECT', label: '보호중', count: 8 }, { status: 'ADOPTED', label: '입양완료', count: 4 }, { status: 'UNKNOWN', label: '미분류', count: total - 12 }];
    else if (path === '/api/users/me') body = envelope(null);
    else return route.fulfill({ status: 501, json: { message: 'Unmocked API: ' + path } });
    await route.fulfill({ json: body });
  });
  await page.goto(origin + '/login');
  await page.evaluate(() => localStorage.setItem('auth-storage', JSON.stringify({ state: { user: { id: 99, name: '관리자', email: 'admin@example.invalid', role: 'ROLE_ADMIN' }, accessToken: 'local-mock-only', refreshToken: null }, version: 0 })));
  const open = async () => {
    await page.goto(origin + '/admin/statistics');
    await page.getByRole('heading', { name: '통계', exact: true }).waitFor();
  };
  const settled = async () => page.waitForFunction(() => ![...document.querySelectorAll('[role="status"]')].some(el => el.textContent.includes('불러오는')));
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [label, heading] of [['보호동물', '구조·접수 추이'], ['회원', '회원 가입 추이'], ['보호소', '담당자 신청 접수 추이'], ['커뮤니티', '게시글 작성 추이']]) {
      mode = 'normal';
      await open();
      await page.getByRole('button', { name: label, exact: true }).click();
      await page.getByRole('heading', { name: heading, exact: true }).waitFor();
      await settled();
      const geometry = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, font: getComputedStyle(document.querySelector('main')).fontFamily }));
      check(!geometry.overflow, width + 'px overflow: ' + label);
      check(geometry.font.includes('Noto Sans KR'), 'Wrong font: ' + label);
      check(await page.getByRole('button', { name: label, exact: true }).getAttribute('aria-pressed') === 'true', 'Area selection state');
      const lastBar = page.getByRole('button', { name: /^\d{4}-\d{2}-\d{2} / }).last();
      await lastBar.scrollIntoViewIfNeeded();
      await lastBar.click();
      check(await lastBar.getAttribute('aria-pressed') === 'true', 'Last chart bar must be reachable on mobile: ' + label);
      if (width !== 320) await page.screenshot({ path: '/tmp/admin-stats-' + width + '-' + label + '.png', fullPage: true });
    }
    results.push(width + 'px: four areas, no overflow, shared font');
  }
  await open();
  await settled();
  const bar = page.getByRole('button', { name: /^\d{4}-\d{2}-\d{2} / }).first();
  await bar.focus();
  await page.keyboard.press('Enter');
  check(await bar.getAttribute('aria-pressed') === 'true', 'Chart must support keyboard selection');
  check(await page.getByText('전일 대비 -5마리 (-50.0%)', { exact: true }).count() === 1, 'First day must use separate previousDayCount');
  await page.getByRole('button', { name: '신규 수집 · 보조 지표', exact: true }).click();
  await page.getByRole('heading', { name: '동물 신규 수집 추이', exact: true }).waitFor();
  check(requests.some(request => request.path.endsWith('/daily-animals')), 'Keep legacy collection API');
  check(await page.getByText(/실제 발견·접수 건수가 아닙니다/).isVisible(), 'Collection meaning');
  results.push('separate previous-day count and preserved collection auxiliary view');

  await open();
  await page.getByRole('button', { name: '최근 30일', exact: true }).click();
  await settled();
  check(await page.getByRole('button', { name: '다음', exact: true }).isEnabled(), 'Long period pagination');
  await page.getByRole('button', { name: '다음', exact: true }).click();
  check(await page.getByText('2 / 5', { exact: true }).isVisible(), 'Page advances');
  await page.getByRole('button', { name: '최근 7일', exact: true }).click();
  await settled();
  check(await page.getByText('1 / 1', { exact: true }).isVisible(), 'Range resets page');
  check(await page.getByRole('button', { name: '다음', exact: true }).isDisabled(), 'Short period pagination');
  results.push('30-day grouping, pagination and range reset');

  const end = await page.getByLabel('종료일', { exact: true }).inputValue();
  const startDate = new Date(end + 'T00:00:00Z'); startDate.setUTCDate(startDate.getUTCDate() - 365);
  const start = startDate.toISOString().slice(0, 10);
  await page.getByLabel('시작일', { exact: true }).fill(start);
  requests.length = 0;
  await page.getByRole('button', { name: '조회', exact: true }).click();
  await settled();
  const bounded = requests.find(request => request.path.endsWith('/intake-trend'));
  check(bounded?.params.startDate === start && bounded.params.endDate === end, 'New API must receive exactly 366 days, not 367');
  check(await page.getByText('1 / 53', { exact: true }).isVisible(), '366-day calendar rows');
  startDate.setUTCDate(startDate.getUTCDate() - 1);
  await page.getByLabel('시작일', { exact: true }).fill(startDate.toISOString().slice(0, 10));
  requests.length = 0;
  await page.getByRole('button', { name: '조회', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: '최대 366일' }).waitFor();
  check(requests.length === 0, 'Invalid period must not fetch');
  results.push('366-day accepted without expanded new request, 367-day rejected');

  for (const label of ['보호동물', '회원', '보호소', '커뮤니티']) {
    mode = 'zero'; await open();
    await page.getByRole('button', { name: label, exact: true }).click();
    await settled();
    check(await page.getByText('변동 없음', { exact: false }).count() > 0, 'Empty success fills zero days: ' + label);
    check(await page.getByRole('alert').count() === 0, 'Empty data must not be an error');
  }
  results.push('successful empty data fills zero calendar series in all areas');
  mode = 'partial'; await open();
  await page.getByRole('button', { name: '회원', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: '조회 실패' }).waitFor();
  check(await page.getByRole('heading', { name: '회원 가입 추이', exact: true }).isVisible(), 'Partial count failure must preserve trend');
  check(await page.getByRole('heading', { name: '날짜별 상세', exact: true }).isVisible(), 'Partial failure must preserve daily table');
  mode = 'normal';
  await page.getByRole('button', { name: '다시 불러오기', exact: true }).click();
  await page.getByText('1,280명', { exact: true }).waitFor();
  results.push('independent current metric failure and retry without losing trend');

  for (const [label, heading] of [['보호동물', '구조·접수'], ['회원', '회원 가입'], ['보호소', '담당자 신청 접수'], ['커뮤니티', '게시글 작성']]) {
    mode = 'error'; await open();
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.getByRole('heading', { name: heading + ' 추이 조회 실패', exact: true }).waitFor();
    check(await page.getByRole('heading', { name: '날짜별 상세', exact: true }).count() === 0, 'Error must not render a zero table: ' + label);
    if (label === '보호동물') check(await page.getByRole('heading', { name: '접수 동물의 현재 상태', exact: true }).isVisible(), 'Independent successful status remains visible');
  }
  results.push('all area trend errors are not zero and independent animal status remains');

  mode = 'loading'; await open();
  await page.getByRole('status', { name: '구조·접수 추이를 불러오는 중입니다.', exact: true }).waitFor();
  check(await page.getByRole('heading', { name: '날짜별 상세', exact: true }).count() === 0, 'Loading must not render a zero table');
  mode = 'normal'; release(); await settled();
  results.push('loading is explicit, then resolves without fake zero table');
  for (const role of [null, 'ROLE_USER', 'ROLE_SHELTER']) {
    await page.evaluate(role => localStorage.setItem('auth-storage', JSON.stringify({ state: { user: role ? { id: 3, role } : null, accessToken: role ? 'local-mock-only' : null }, version: 0 })), role);
    requests.length = 0;
    await page.goto(origin + '/admin/statistics');
    await page.getByText(role ? '접근 권한이 없습니다' : '로그인이 필요합니다', { exact: true }).waitFor();
    check(!requests.some(request => /intake-trend|shelter-applications\/stats|posts\/stats\/period/.test(request.path)), 'Denied role must not fetch stats');
  }
  results.push('guest, user and shelter roles blocked before admin data fetch');
  check(errors.length === 0, 'Page errors: ' + errors.join('; '));
  page.off('pageerror', onError);
  await page.unroute('**/api/**');
  return { results, normalRenders: 12, screenshotCount: 8, pageErrors: errors, liveApiRequests: 0 };
}
