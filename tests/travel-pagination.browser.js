// Local browser contract. All API responses are synthetic; no provider or production calls.
async page => {
  const checks = [];
  const check = (ok, name) => { if (!ok) throw new Error(name); checks.push(name); };
  let fail = false, legacy = false, listRequests = 0, total = 21;
  const place = index => ({ contentId: String(1000 + index), title: `페이지 검증 장소 ${index + 1}`, address: '테스트 주소', imageUrl: null });
  await page.unrouteAll();
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const url = route.request().url();
    const path = url.split('/api/')[1].split('?')[0];
    if (path === 'places/regions') return route.fulfill({ json: { items: [{ code: '11', name: '서울' }, { code: '26', name: '부산' }], fetchedAt: null, availability: 'READY' } });
    if (path === 'places') {
      listRequests++;
      if (fail) return route.fulfill({ status: 503, json: { code: 'PET_TRAVEL_UNAVAILABLE' } });
      const requested = Number(url.match(/[?&]page=([0-9]+)/)?.[1] ?? 0);
      const current = legacy ? 0 : requested;
      const items = Array.from({ length: Math.max(0, Math.min(10, total - current * 10)) }, (_, i) => place(current * 10 + i));
      return route.fulfill({ json: { areaCode: url.includes('areaCode=26') ? '26' : '11', items, previewOnly: true, fetchedAt: null, availability: 'PARTIAL',
        ...(legacy ? {} : { page: current, size: 10, totalElements: total, totalPages: Math.ceil(total / 10) }) } });
    }
    if (/^places\/\d+$/.test(path)) return route.fulfill({ json: { place: place(Number(path.split('/')[1]) - 1000), overview: null,
      conditions: {}, petInformationAvailable: false, petInformationStatus: 'PREPARING', fetchedAt: null, petInformationFetchedAt: null } });
    return route.abort();
  });
  const cards = () => page.locator('section[aria-labelledby="travel-results-title"] ul.grid > li');
  for (const width of [320, 375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:5199/travel?areaCode=11');
    await page.getByRole('heading', { name: '페이지 검증 장소 1', exact: true }).waitFor();
    check(await cards().count() === 10, `first page has ten ${width}`);
    check(await page.getByRole('button', { name: '이전 페이지', exact: true }).isDisabled(), `first previous disabled ${width}`);
    await page.getByRole('button', { name: '다음 페이지', exact: true }).click();
    await page.getByRole('heading', { name: '페이지 검증 장소 11', exact: true }).waitFor();
    check(page.url().endsWith('areaCode=11&page=2'), `second URL ${width}`);
    check(await cards().count() === 10, `second page has ten ${width}`);
    check(await page.getByRole('button', { name: '2페이지', exact: true }).getAttribute('aria-current') === 'page', `active page ${width}`);
    await cards().first().getByRole('link').click();
    await page.getByRole('heading', { name: '페이지 검증 장소 11', exact: true }).waitFor();
    check(page.url().includes('/travel/1010?areaCode=11&page=2'), `detail keeps origin ${width}`);
    await page.goBack();
    await page.getByRole('button', { name: '2페이지', exact: true }).waitFor();
    check(page.url().endsWith('areaCode=11&page=2'), `browser back ${width}`);
    await cards().first().getByRole('link').click();
    await page.getByRole('link', { name: '서울 목록으로', exact: false }).click();
    await page.getByRole('button', { name: '2페이지', exact: true }).waitFor();
    check(page.url().endsWith('areaCode=11&page=2'), `explicit back ${width}`);
    await page.getByRole('button', { name: '다음 페이지', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('heading', { name: '페이지 검증 장소 21', exact: true }).waitFor();
    check(await cards().count() === 1, `last page remainder ${width}`);
    check(await page.getByRole('button', { name: '다음 페이지', exact: true }).isDisabled(), `last next disabled ${width}`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no horizontal overflow ${width}`);
    await page.getByLabel('지역 (시·도)').selectOption('26');
    await page.getByRole('heading', { name: '페이지 검증 장소 1', exact: true }).waitFor();
    check(page.url().endsWith('areaCode=26'), `region resets page ${width}`);
    await page.goto('http://127.0.0.1:5199/travel?areaCode=11&page=99');
    await page.getByRole('link', { name: '첫 페이지로' }).waitFor();
    check(await cards().count() === 0, `out of range not first page ${width}`);
    await page.getByRole('link', { name: '첫 페이지로' }).click();
    await page.getByRole('heading', { name: '페이지 검증 장소 1', exact: true }).waitFor();
    check(page.url().endsWith('areaCode=11'), `out of range recovery ${width}`);
  }
  for (const query of ['page=0', 'page=-1', 'page=1&page=2', 'page=99999999999']) {
    const before = listRequests;
    await page.goto(`http://127.0.0.1:5199/travel?areaCode=11&${query}`);
    await page.getByText('페이지 주소를 확인해 주세요', { exact: true }).waitFor();
    check(listRequests === before, `invalid URL makes no list request ${query}`);
  }
  fail = true;
  await page.goto('http://127.0.0.1:5199/travel?areaCode=11&page=2');
  await page.getByText('장소를 불러오지 못했어요', { exact: true }).waitFor();
  check(await cards().count() === 0, 'failure hides stale cards');
  fail = false;
  await page.getByRole('button', { name: /다시/ }).click();
  await page.getByRole('heading', { name: '페이지 검증 장소 11', exact: true }).waitFor();
  check(page.url().endsWith('page=2'), 'retry preserves page');
  legacy = true;
  await page.goto('http://127.0.0.1:5199/travel?areaCode=11&page=3');
  await page.getByRole('link', { name: '첫 페이지로' }).waitFor();
  check(await cards().count() === 0, 'old backend cannot masquerade first page as third');
  legacy = false; total = 71;
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:5199/travel?areaCode=11&page=4');
    await page.getByRole('heading', { name: '페이지 검증 장소 31', exact: true }).waitFor();
    const buttons = page.getByRole('navigation', { name: '페이지 이동' }).locator('button:visible');
    check(await buttons.count() === (width === 320 ? 5 : 7), `responsive page window ${width}`);
    check(await buttons.evaluateAll(nodes => nodes.every(n => n.getBoundingClientRect().width >= 44 && n.getBoundingClientRect().height >= 44)), `touch areas ${width}`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `many pages do not overflow ${width}`);
    await page.getByRole('button', { name: '다음 페이지' }).click();
    await page.getByRole('heading', { name: '페이지 검증 장소 41', exact: true }).waitFor();
    check(await page.evaluate(() => document.activeElement?.id === 'travel-results-title'), `page change focuses results ${width}`);
  }
  return { passed: checks.length, checks };
}
