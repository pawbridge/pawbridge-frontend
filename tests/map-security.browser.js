// Loopback app + synthetic statistics only; no production API, login or database.
async (page, origin, evidenceDirectory, phase) => {
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) throw new Error('Loopback origin required');
  const checks = [], snapshots = [], errors = [], unexpected = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
  let state = 'normal', releasePending;
  const fixture = [{ region: '서울특별시', count: 8 }, { region: '경기도', count: 10 }, { region: '부산광역시', count: 2 }];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname.startsWith('/api/v1/')) {
      if (url.pathname.endsWith('/stats/regional')) {
        if (state === 'loading') await new Promise(resolve => { releasePending = resolve; });
        if (state === 'error') return route.fulfill({ status: 503, json: { message: 'Synthetic unavailable' } });
        return route.fulfill({ json: state === 'empty' ? [] : fixture });
      }
      if (url.pathname.endsWith('/stats/today')) return route.fulfill({ json: { date: today, rescuedToday: 20, adoptedToday: 2 } });
      if (url.pathname.endsWith('/stats/status')) return route.fulfill({ json: [{ status: 'PROTECT', label: '보호중', count: 20 }] });
      if (url.pathname === '/api/v1/visits/identity' || (url.pathname === '/api/v1/visits/today' && request.method() === 'POST')) return route.fulfill({ status: 204 });
      if (url.pathname === '/api/v1/visits/today') return route.fulfill({ json: { data: { date: today, count: 0 } } });
      unexpected.push(`${request.method()} ${url.pathname}`);
      return route.abort();
    }
    if (url.origin === origin) return route.continue();
    // Keep public fonts/SDK/images deterministic without sending external traffic.
    if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.fulfill({ contentType: 'text/css', body: '' });
    if (url.hostname === 't1.daumcdn.net') return route.fulfill({ contentType: 'text/javascript', body: 'window.daum = { Postcode: class { open() {} } };' });
    if (request.resourceType() === 'image' || (url.hostname === 'www.pawbridge.kr'
      && ['/favicon-96.png', '/apple-touch-icon.png'].includes(url.pathname))) {
      return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg"/>' });
    }
    unexpected.push(`${request.method()} ${url.hostname}${url.pathname}`);
    return route.abort();
  });
  const geography = () => page.locator('[data-map-surface="main"] [data-region="경기도"]');
  const style = locator => locator.evaluate(element => ({ stroke: getComputedStyle(element).stroke, width: getComputedStyle(element).strokeWidth }));
  const geographyPoint = locator => locator.evaluate(element => {
    const box = element.getBBox(), matrix = element.getScreenCTM();
    for (let x = 0.1; x < 1; x += 0.1) for (let y = 0.1; y < 1; y += 0.1) {
      const point = new DOMPoint(box.x + box.width * x, box.y + box.height * y);
      if (element.isPointInFill(point)) { const screen = point.matrixTransform(matrix); return { x: screen.x, y: screen.y }; }
    }
    throw new Error('No point inside province');
  });
  for (const width of [1440, 375]) for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width, height: 1000 });
    state = 'normal';
    await page.goto(`${origin}/animals/stats`, { waitUntil: 'domcontentloaded' });
    await geography().waitFor();
    await page.evaluate(theme => document.documentElement.classList.toggle('dark', theme === 'dark'), theme);
    const suffix = `${width}-${theme}`;
    const main = page.locator('[data-map-surface="main"]');
    await main.scrollIntoViewIfNeeded();
    await page.mouse.move(1, 1);
    const normal = await style(geography());
    const point = await geographyPoint(geography());
    await page.mouse.move(point.x, point.y);
    await page.getByRole('tooltip').waitFor();
    assert((await page.getByRole('tooltip').innerText()).includes('경기도'), 'Wrong hover tooltip');
    const hovered = await style(geography());
    assert(hovered.width === '2px' && hovered.stroke !== normal.stroke, 'Province hover lost outline');
    await geography().dispatchEvent('mousedown');
    assert(JSON.stringify(await style(geography())) === JSON.stringify(normal), 'Pressed province should use default outline');
    await geography().dispatchEvent('mouseup');
    assert(JSON.stringify(await style(geography())) === JSON.stringify(hovered), 'Mouseup should restore hover outline');
    await page.mouse.move(1, 1);
    assert(JSON.stringify(await style(geography())) === JSON.stringify(normal), 'Mouseleave should reset outline');
    await geography().focus();
    assert(JSON.stringify(await style(geography())) === JSON.stringify(hovered), 'Focus should retain existing outline');
    await geography().evaluate(element => element.blur());
    checks.push(`hover-press-release-leave-focus-${suffix}`);

    const before = await main.evaluate(element => ({
      bounds: { width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height },
      svg: { viewBox: element.querySelector('svg').getAttribute('viewBox'), width: element.querySelector('svg').getAttribute('width'), height: element.querySelector('svg').getAttribute('height') },
      regions: Array.from(element.querySelectorAll('[data-region]'), path => ({ name: path.getAttribute('data-region'), fill: getComputedStyle(path).fill, stroke: getComputedStyle(path).stroke, width: getComputedStyle(path).strokeWidth, band: path.getAttribute('data-band') })),
      markers: Array.from(element.querySelectorAll('.rsm-marker text'), text => text.textContent),
    }));
    await main.screenshot({ path: `${evidenceDirectory}/${phase}-${suffix}-map.png` });
    snapshots.push({ suffix, ...before });
    assert(before.regions.length === 17 && before.svg.viewBox === '0 0 500 620', 'Map geography or dimensions changed');
    assert(before.svg.width === null && before.svg.height === null, 'Responsive SVG gained fixed size');
    const rank = page.getByRole('button', { name: /경기도.*10마리/ });
    await rank.focus();
    await page.keyboard.press('Enter');
    assert(await rank.getAttribute('aria-pressed') === 'true', 'Keyboard region selection failed');
    assert(await geography().getAttribute('data-selected') === 'true', 'Map/list selection not synchronized');
    await page.getByRole('heading', { name: '경기도', exact: true }).waitFor();
    assert(await geography().evaluate(element => getComputedStyle(element).strokeWidth) === '2px', 'Selected region outline changed');
    await page.getByRole('button', { name: '선택 해제', exact: true }).click();
    await main.scrollIntoViewIfNeeded();
    const target = await geographyPoint(geography());
    await page.mouse.click(target.x, target.y);
    assert(await rank.getAttribute('aria-pressed') === 'true', 'Map click selection failed');
    checks.push(`map-click-keyboard-selection-markers-${suffix}`);

    await page.getByRole('button', { name: '지도 크게 보기', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    const zoom = dialog.getByRole('button', { name: '지도 확대', exact: true });
    const zoomOut = dialog.getByRole('button', { name: '지도 축소', exact: true });
    assert(await zoomOut.isDisabled(), 'Minimum zoom guard lost');
    await zoom.click();
    await dialog.getByText('150%', { exact: true }).waitFor();
    await zoom.click(); await zoom.click(); await zoom.click();
    await dialog.getByText('300%', { exact: true }).waitFor();
    assert(await zoom.isDisabled(), 'Maximum zoom guard lost');
    await zoomOut.click();
    await dialog.getByText('250%', { exact: true }).waitFor();
    const group = dialog.locator('.rsm-zoomable-group');
    const transform = await group.getAttribute('transform');
    const box = await dialog.locator('[data-map-surface="expanded"] svg').boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5 + 40, box.y + box.height * 0.4 + 20, { steps: 5 });
    await page.mouse.up();
    assert(await group.getAttribute('transform') !== transform, 'Expanded map drag did not move');
    await dialog.getByRole('button', { name: '전체 보기', exact: true }).click();
    await dialog.getByText('100%', { exact: true }).waitFor();
    await dialog.getByRole('combobox', { name: /^지역 선택/ }).selectOption('부산광역시');
    await dialog.getByRole('heading', { name: '부산광역시', exact: true }).waitFor();
    await page.mouse.move(1, 1);
    await dialog.screenshot({ path: `${evidenceDirectory}/${phase}-${suffix}-expanded.png` });
    await page.keyboard.press('Escape');
    assert(await dialog.count() === 0, 'Escape did not dismiss map dialog');
    assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'Horizontal overflow');
    checks.push(`responsive-zoom-drag-reset-select-escape-${suffix}`);
  }
  for (const scenario of ['loading', 'empty', 'error']) {
    state = scenario;
    await page.goto(`${origin}/animals/stats`, { waitUntil: 'domcontentloaded' });
    const regional = page.locator('section[aria-labelledby="regional-heading"]');
    if (scenario === 'loading') {
      await regional.getByText('지역별 현황을 불러오는 중입니다.', { exact: true }).waitFor();
      state = 'normal'; releasePending();
      await geography().waitFor();
    } else if (scenario === 'empty') {
      await regional.getByText('선택한 기간에 집계된 구조 동물이 없습니다.', { exact: true }).waitFor();
      assert(await geography().getAttribute('data-band') === '0', 'Zero-count geography lost empty color');
    } else {
      await regional.getByRole('alert').waitFor();
      state = 'normal';
      await regional.getByRole('button', { name: '다시 시도', exact: true }).click();
      await geography().waitFor();
    }
    checks.push(`${scenario}-and-recovery`);
  }
  assert(errors.length === 0, `Uncaught errors: ${errors.join('; ')}`);
  assert(unexpected.length === 0, `Unexpected requests: ${unexpected.join('; ')}`);
  return { checks, snapshots, uncaughtErrors: errors.length, unexpectedRequests: unexpected.length, apiMocked: true, fontsMocked: true, productionVerified: false };
}
