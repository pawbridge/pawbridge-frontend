// Run against an npm run preview server on 127.0.0.1:5203 with playwright-cli.
// All API requests are intercepted; no real account or animal data is changed.
async page => {
  const origin = 'http://127.0.0.1:5203';
  const checks = [];
  const errors = [];
  const unexpected = [];
  const requests = [];
  let total = 0;
  let role = 'ROLE_SHELTER';
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const user = () => ({ id: 10, userId: 10, role, provider: 'LOCAL',
    name: '테스트회원', nickname: '보호소', email: 'shelter@example.invalid', careRegNo: 'test-shelter' });
  const onError = error => errors.push(error.message);
  const handler = async route => {
    const request = route.request();
    const path = request.url().replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    if (!path.startsWith('/api/')) return route.continue();
    if (request.method() === 'GET' && path === '/api/users/me') {
      return route.fulfill({ json: { code: 200, data: user() } });
    }
    if (request.method() === 'GET' && path === '/api/users/me/registered-animals') {
      const query = request.url().split('?')[1];
      const number = Number(query.match(/(?:^|&)page=(\d+)/)?.[1]);
      assert(/(?:^|&)size=20(?:&|$)/.test(query), 'Page size changed');
      assert(decodeURIComponent(query).includes('sort=createdAt,desc'), 'Sort changed');
      assert(number >= 0 && number < Math.max(1, Math.ceil(total / 20)), 'Out-of-range request');
      requests.push(number);
      const content = Array.from({ length: Math.min(20, total - number * 20) }, (_, i) => ({
        id: number * 20 + i + 1, breed: `검증동물 ${number * 20 + i + 1}`, species: 'DOG',
        // The actual user-service DTO has no apiSource. Notice numbers are not a filter.
        apmsNoticeNo: `custom-${number * 20 + i + 1}`, status: 'PROTECT', gender: 'UNKNOWN',
        shelterId: 1, shelterName: '검증 보호소', age: 2, favoriteCount: 0,
      }));
      return route.fulfill({ json: { code: 200, data: {
        content, page: number, size: 20, totalElements: total,
        totalPages: Math.ceil(total / 20), last: number >= Math.ceil(total / 20) - 1,
      } } });
    }
    unexpected.push(`${request.method()} ${path}`);
    return route.abort();
  };
  await page.addInitScript(() => localStorage.setItem('pawbridge.analytics-consent.v1', 'denied'));
  page.on('pageerror', onError);
  await page.route('**/api/**', handler);
  const cards = () => page.locator('main a[href^="/animals/"]').filter({ has: page.locator('h3') });
  const open = async route => {
    await page.evaluate(user => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user, accessToken: 'test-only-token' }, version: 0 }));
      sessionStorage.setItem('mypageActiveTab', 'registeredAnimals');
    }, user());
    const response = role === 'ROLE_SHELTER'
      ? page.waitForResponse(response => response.url().includes('/api/users/me/registered-animals') && response.status() === 200)
      : null;
    await page.goto(origin + route);
    if (response) await response;
  };
  try {
    await page.goto(origin + '/login');
    for (const width of [1920, 390]) {
      await page.setViewportSize({ width, height: width === 1920 ? 1080 : 844 });
      for (const route of ['/mypage', '/registered-animals']) {
        const previous = () => page.getByRole('button', { name: route === '/mypage' ? '이전' : '이전 페이지', exact: true });
        const next = () => page.getByRole('button', { name: route === '/mypage' ? '다음' : '다음 페이지', exact: true });
        for (const count of (width === 1920 ? [0, 1, 20, 21, 41, 201] : [41, 201])) {
          total = count;
          requests.length = 0;
          await open(route);
          if (count === 0) {
            await page.getByText(/아직 등록한 동물이 없습니다/).waitFor();
            assert(await cards().count() === 0 && await next().count() === 0, 'Empty list has cards/pages');
          } else {
            await page.getByText(`총 ${count}마리의 동물을 등록했습니다`, { exact: true }).waitFor();
            const pages = Math.ceil(count / 20);
            for (let number = 0; number < pages; number++) {
              await page.getByRole('heading', { name: `검증동물 ${number * 20 + 1}`, exact: true }).waitFor();
              assert(await cards().count() === Math.min(20, count - number * 20), 'Wrong page content length');
              assert(await cards().first().getAttribute('href') === `/animals/${number * 20 + 1}`, 'Wrong detail destination');
              assert(await page.getByText(`총 ${count}마리의 동물을 등록했습니다`, { exact: true }).count() === 1, 'Total changed with page');
              if (pages > 1) {
                assert(await previous().isDisabled() === (number === 0), 'Wrong previous boundary');
                assert(await next().isDisabled() === (number === pages - 1), 'Wrong next boundary');
                assert(await page.locator('main button[aria-current="page"]').innerText() === String(number + 1), 'Active page not visible');
              } else assert(await next().count() === 0, 'Single page has pagination');
              assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `Overflow ${route}/${width}/${number}`);
              if (number < pages - 1) await next().click();
            }
            if (pages > 1) {
              await page.getByRole('button', { name: String(pages - 1), exact: true }).click();
              await page.getByRole('heading', { name: `검증동물 ${(pages - 2) * 20 + 1}`, exact: true }).waitFor();
              if (pages > 2) {
                await previous().click();
                await page.getByRole('heading', { name: `검증동물 ${(pages - 3) * 20 + 1}`, exact: true }).waitFor();
              }
            }
          }
          assert(requests[0] === 0, 'Initial page must be zero');
          checks.push(`${route} ${count} animals ${width}px`);
          if (count === 41) {
            await previous().locator('..').screenshot({ path: `/tmp/registered-pagination-${route === '/mypage' ? 'tab' : 'page'}-${width}.png`, animations: 'disabled' });
            await page.screenshot({ path: `/tmp/registered-${route === '/mypage' ? 'tab' : 'page'}-${width}.png`, fullPage: true, animations: 'disabled' });
          }
        }
      }
    }
    role = 'ROLE_USER';
    requests.length = 0;
    await open('/mypage');
    await page.getByRole('button', { name: '프로필 정보' }).waitFor();
    assert(await page.getByRole('button', { name: '내 보호소가 등록한 동물', exact: true }).count() === 0, 'Member sees shelter menu');
    assert(requests.length === 0, 'Member requested registered animals');
    assert(errors.length === 0, `Page errors: ${errors}`);
    assert(unexpected.length === 0, `Unexpected API traffic: ${unexpected}`);
    return { checks, memberAccess: 'pass', pageErrors: errors, unexpectedRequests: unexpected };
  } finally {
    await page.unroute('**/api/**', handler);
    page.off('pageerror', onError);
  }
}
