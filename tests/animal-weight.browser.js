// Local-only API fixtures; no live account, API, or DB is used.
async page => {
  const origin = page.url().match(/^https?:\/\/[^/]+/)[0];
  const checks = [], errors = [], unexpected = [], updates = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const cases = [
    { value: '3(Kg)', label: '3(Kg)' },
    { value: '3.5', label: '3.5 kg' },
    { value: '2㎏', label: '2㎏' },
    { value: undefined, label: null },
    { value: '', label: null },
    { value: '미상', label: '미상' },
  ];
  const user = { id: 10, name: '체중검증회원', email: 'weight@example.invalid', role: 'ROLE_SHELTER', careRegNo: 'weight-test-shelter' };
  const animals = cases.map(({ value }, index) => ({
    id: 100 + index, name: `검증 동물 ${index}`, breed: `체중검증품종${index}`,
    species: 'DOG', gender: 'MALE', status: 'PROTECT', weight: value,
    shelterId: 1, shelterName: '검증 보호소', careRegNo: user.careRegNo,
    imageUrl: '', neuterStatus: 'UNKNOWN', birthYear: 2024, color: '흰색',
    happenDate: '2026-10-01', noticeStartDate: '2026-10-01', noticeEndDate: '2026-12-31',
    apmsNoticeNo: `검증-2026-${100 + index}`, apiSource: 'MANUAL',
  }));
  const onError = error => errors.push(error.message);
  const onDialog = dialog => dialog.accept();
  const handler = async route => {
    const request = route.request();
    const path = request.url().replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    if (!path.startsWith('/api/')) return route.continue();
    if (request.method() === 'PUT' && path === '/api/animals/100') {
      updates.push(request.postDataJSON());
      return route.fulfill({ json: animals[0] });
    }
    if (request.method() !== 'GET') {
      unexpected.push(`${request.method()} ${path}`);
      return route.abort();
    }
    if (path === '/api/animals') return route.fulfill({ json: { content: animals, totalElements: 6, totalPages: 1, number: 0, size: 20, first: true, last: true, empty: false } });
    if (path === '/api/users/me') return route.fulfill({ json: { code: 200, data: user } });
    if (/^\/api\/animals\/\d+\/similar$/.test(path)) return route.fulfill({ json: animals });
    if (/^\/api\/animals\/\d+$/.test(path)) return route.fulfill({ json: animals.find(animal => animal.id === Number(path.split('/').at(-1))) });
    if (path.endsWith('/check')) return route.fulfill({ json: { code: 200, data: false } });
    if (path === '/api/shelters/1') return route.fulfill({ json: { id: 1, name: '검증 보호소' } });
    return route.fulfill({ json: [] });
  };
  page.on('pageerror', onError);
  page.on('dialog', onDialog);
  await page.route('**/api/**', handler);
  try {
    await page.evaluate(user => localStorage.setItem('auth-storage', JSON.stringify({ state: { user, accessToken: 'local-weight-test-only' }, version: 0 })), user);
    for (const width of [1920, 390]) {
      await page.setViewportSize({ width, height: width === 1920 ? 1080 : 844 });
      await page.goto(`${origin}/animals`);
      for (const [index, { label }] of cases.entries()) {
        const card = page.locator(`main a[href="/animals/${100 + index}"]`);
        await card.waitFor({ state: 'visible' });
        const text = await card.innerText();
        if (label) assert(text.includes(label), `Search weight missing: ${label} / ${width}`);
        assert(!/(?:\(Kg\)|㎏)\s*kg/i.test(text), `Duplicate search unit / ${width}`);
        if (!label) assert(!/\bkg\b|㎏/i.test(text), `Missing weight gained a unit / ${width}`);
        const box = await card.boundingBox();
        assert(box && box.x >= 0 && box.x + box.width <= width + 1, `Search card overflow / ${width}`);
      }
      await page.screenshot({ path: `/tmp/pawbridge-weight-search-${width}.png`, fullPage: true });
      checks.push(`search: six string/missing weights / ${width}`);
      for (const [index, { label }] of cases.entries()) {
        await page.goto(`${origin}/animals/${100 + index}`);
        await page.getByRole('heading', { name: '기본 정보', exact: true }).waitFor();
        const weightRow = page.locator('dt').filter({ hasText: /^체중$/ }).locator('..');
        if (label) {
          await weightRow.waitFor({ state: 'visible' });
          assert(await weightRow.locator('dd').innerText() === label, `Detail weight changed: ${label} / ${width}`);
        } else assert(await weightRow.count() === 0, `Empty detail weight shown / ${width}`);
        if (index === 0) {
          const recommendations = page.locator('section[aria-labelledby="similar-animals-title"]');
          await recommendations.locator('a[href="/animals/100"]').waitFor();
          for (const [otherIndex, { label: expected }] of cases.entries()) {
            const card = recommendations.locator(`a[href="/animals/${100 + otherIndex}"]`);
            const text = await card.innerText();
            if (expected) assert(text.includes(expected), `Recommendation weight missing: ${expected} / ${width}`);
            assert(!/(?:\(Kg\)|㎏)\s*kg/i.test(text), `Duplicate recommendation unit / ${width}`);
            if (!expected) assert(!/\bkg\b|㎏/i.test(text), `Empty recommendation gained a unit / ${width}`);
          }
          await page.screenshot({ path: `/tmp/pawbridge-weight-detail-${width}.png`, fullPage: true });
          checks.push(`recommendations: six string/missing weights / ${width}`);
        }
      }
      checks.push(`detail: six string/missing weights / ${width}`);
      await page.goto(`${origin}/animals/100/edit`);
      const input = page.getByText('체중', { exact: true }).locator('..').locator('input');
      await input.waitFor({ state: 'visible' });
      assert(await input.inputValue() === '3(Kg)', `Edit did not preserve the API string / ${width}`);
      const response = page.waitForResponse(response => response.request().method() === 'PUT' && response.url().replace(/^https?:\/\/[^/]+/, '').split('?')[0] === '/api/animals/100');
      await page.getByRole('button', { name: '수정하기', exact: true }).click();
      await response;
      await page.waitForURL(`${origin}/animals/100`);
      assert(updates.at(-1)?.weight === '3(Kg)', `Edit request changed the weight string / ${width}`);
      checks.push(`edit: raw weight preserved in mock PUT / ${width}`);
    }
    assert(errors.length === 0, `Page errors: ${errors.join('; ')}`);
    assert(unexpected.length === 0, `Unexpected mutation: ${unexpected.join('; ')}`);
    return { checks, total: checks.length, pageErrors: errors.length, mockUpdates: updates.length, liveWrites: 0 };
  } finally {
    page.off('pageerror', onError);
    page.off('dialog', onDialog);
    await page.unroute('**/api/**', handler);
  }
}
