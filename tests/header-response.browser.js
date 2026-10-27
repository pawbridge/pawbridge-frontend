// playwright-cli run-code --filename=tests/header-response.browser.js
// prod preview: 상단 메뉴는 API 응답을 기다리지 않고 입력에 반응해야 한다.
async page => {
  const origin = new URL(page.url()).origin;
  const checks = [], errors = [];
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  const measure = async (selector, event, predicate, action) => {
    await page.evaluate(({ selector, event, predicate }) => {
      const target = document.querySelector(selector);
      window.__headerResponse = null;
      let started;
      target.addEventListener(event, () => { started = performance.now(); }, { once: true, capture: true });
      const matches = new Function(`return (${predicate});`);
      const observer = new MutationObserver(() => {
        if (started !== undefined && matches()) {
          observer.disconnect();
          window.__headerResponse = performance.now() - started;
        }
      });
      observer.observe(document.body, { subtree: true, childList: true, attributes: true });
    }, { selector, event, predicate });
    await action();
    await page.waitForFunction(() => window.__headerResponse !== null, {}, { timeout: 2000 });
    const ms = await page.evaluate(() => window.__headerResponse);
    if (ms > 100) throw new Error(`Header response delayed: ${selector}: ${ms}ms`);
    return ms;
  };
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${origin}/privacy`, { waitUntil: 'domcontentloaded' });
    const protectedButton = page.getByRole('button', { name: '보호동물', exact: true });
    const lostButton = page.getByRole('button', { name: '실종동물 찾기', exact: true });
    await protectedButton.hover();
    await page.locator('#protected-animal-navigation').waitFor();
    const hoverSwitchMs = await measure('[aria-controls="lost-animal-navigation"]', 'pointerover',
      'document.querySelector("[aria-controls=lost-animal-navigation]").getAttribute("aria-expanded") === "true"',
      () => lostButton.hover());
    await page.locator('#lost-animal-navigation').hover();
    if (await lostButton.getAttribute('aria-expanded') !== 'true') throw new Error('Menu closed while entering panel');
    await page.keyboard.press('Escape');
    if (await lostButton.getAttribute('aria-expanded') !== 'false') throw new Error('Escape did not close menu');
    if (!await lostButton.evaluate(el => el === document.activeElement)) throw new Error('Escape lost keyboard focus');
    await page.keyboard.press('Enter');
    await page.locator('#lost-animal-navigation').waitFor();
    await page.keyboard.press('Escape');
    await protectedButton.click();
    await page.locator('#protected-animal-navigation').waitFor();
    await protectedButton.click();
    if (await protectedButton.getAttribute('aria-expanded') !== 'false') throw new Error('Click toggle failed');
    await page.mouse.move(0, 0);
    await protectedButton.hover();
    await page.locator('#protected-animal-navigation').waitFor();
    const last = await page.locator('#protected-animal-navigation a').last().boundingBox();
    await page.mouse.move(last.x + 30, last.y + 30, { steps: 12 });
    await page.waitForTimeout(200);
    if (!await page.locator('#protected-animal-navigation').isVisible()) throw new Error('Diagonal panel movement switched the menu');
    await page.keyboard.press('Escape');
    checks.push({ width: 1440, hoverSwitchMs, panelPointer: true, diagonalPanelPointer: true, escapeFocus: true, keyboard: true, clickToggle: true });

    // API는 1.2초 늦춰도 메뉴 선택과 URL 변경은 즉시 일어나야 한다.
    const slowAPI = async route => {
      if (!new URL(route.request().url()).pathname.startsWith('/api/v1/')) return route.continue();
      await new Promise(resolve => setTimeout(resolve, 1200));
      await route.fulfill({ json: { code: 200, data: [] } }).catch(() => {});
    };
    await page.route('**/api/v1/**', slowAPI);
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${origin}/privacy`, { waitUntil: 'domcontentloaded' });
      if (width < 1280) await page.getByRole('button', { name: '메뉴 열기' }).click();
      const nav = page.getByRole('navigation', { name: width < 1280 ? '모바일 메뉴' : '주 메뉴', exact: true });
      const link = nav.getByRole('link', { name: '입양후기', exact: true });
      if (await link.evaluate(el => getComputedStyle(el).transitionDuration) !== '0s') {
        throw new Error(`Header highlight fades after input at ${width}`);
      }
      const clickMs = await measure(`${width < 1280 ? '#mobile-navigation' : 'nav[aria-label="주 메뉴"]'} a[href="/adoption"]`, 'click',
        `location.pathname === '/adoption' && ${width < 1280 ? '!document.querySelector("#mobile-navigation")' : 'document.querySelector(\'nav[aria-label="주 메뉴"] a[href="/adoption"]\').getAttribute("aria-current") === "page"'}`,
        async () => { await link.focus(); await page.keyboard.press('Enter'); });
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Overflow at ${width}`);
      await page.goBack();
      await page.getByRole('heading', { name: '개인정보처리방침', exact: true }).waitFor();
      checks.push({ width, clickMs, delayedAPIMs: 1200, keyboardLink: true, back: true, overflow: false });
    }
    await page.unroute('**/api/v1/**', slowAPI);
    if (errors.length) throw new Error(errors.join('; '));
    return { passed: true, mockedAPI: true, responseBudgetMs: 100, checks, errors };
  } finally {
    page.off('pageerror', onError);
  }
};
