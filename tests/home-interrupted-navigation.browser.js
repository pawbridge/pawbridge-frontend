// playwright-cli run-code --filename=tests/home-interrupted-navigation.browser.js
// 로컬 prod preview 전용(기본 127.0.0.1:5212). API를 지연시켜 실제 XHR 중단을 검증한다.
async page => {
  const current = new URL(page.url());
  const origin = ['127.0.0.1', 'localhost'].includes(current.hostname)
    ? current.origin : 'http://127.0.0.1:5212';
  let delayed = false;
  const errors = [], unexpected = [], checks = [], seen = [];
  const onError = error => errors.push(error.message);
  const animals = [1, 2, 3].map(id => ({
    id, species: 'DOG', breed: `검수 동물 ${id}`, gender: 'MALE',
    birthYear: 2025, status: 'PROTECT', shelterName: '검수 보호소',
  }));
  const handler = async route => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith('/api/v1/')) return route.continue();
    seen.push(path);
    let data;
    if (path === '/api/v1/animals') data = { content: animals, totalElements: 3, totalPages: 1 };
    else if (path === '/api/v1/animals/stats/status') data = [
      { status: 'PROTECT', count: 2 }, { status: 'ADOPTED', count: 1 }, { status: 'EUTHANIZED', count: 1 },
    ];
    else if (path === '/api/v1/animals/stats/today') data = { rescuedToday: 3 };
    else if (path === '/api/v1/posts/read') data = { code: 200, data: [] };
    else if (path === '/api/v1/home/videos') data = { code: 200, data: [] };
    else { unexpected.push(path); data = {}; }
    if (delayed) await new Promise(resolve => setTimeout(resolve, 600));
    // 이탈한 페이지의 모의 응답은 전송 대상 자체가 없어질 수 있다.
    await route.fulfill({ json: data }).catch(() => {});
  };
  page.on('pageerror', onError);
  await page.route('**/api/v1/**', handler);
  try {
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      delayed = false;
      await page.goto(origin);
      const cards = page.locator('section[aria-labelledby="animals-heading"] a[href^="/animals/"]');
      await cards.first().waitFor();
      if (await cards.count() !== 3) throw new Error(`Normal home cards changed at ${width}`);
      if (await page.locator('section[aria-labelledby="stats-heading"]').getByText('25.0', { exact: false }).count() !== 2) {
        throw new Error(`Normal home outcome rates changed at ${width}`);
      }
      delayed = true;
      const requested = page.waitForRequest(request => new URL(request.url()).pathname === '/api/v1/animals');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { name: /한 번의 만남/ }).waitFor();
      await requested;
      await page.goto(`${origin}/login`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { name: '로그인', exact: true }).waitFor();
      await page.waitForTimeout(100);
      delayed = false;
      await page.goto(origin);
      await cards.first().waitFor();
      if (await cards.count() !== 3) throw new Error(`Home did not recover at ${width}`);
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
        throw new Error(`Home horizontal overflow at ${width}`);
      }
      checks.push({ width, normalCards: 3, interruptedNavigation: true, returnHome: true, overflow: false });
    }
    if (errors.length) throw new Error(`Home runtime errors: ${errors.join(', ')}`);
    if (unexpected.length) throw new Error(`Unexpected API: ${unexpected.join(', ')}`);
    return { passed: true, mockedAPI: true, actualXHRInterruption: true, checks, errors };
  } catch (error) {
    throw new Error(`${error.message}; ${JSON.stringify({ errors, unexpected, checks, seen })}`);
  } finally {
    page.off('pageerror', onError);
    await page.unroute('**/api/v1/**', handler);
  }
};
