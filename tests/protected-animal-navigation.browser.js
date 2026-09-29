// Local-only UI contract checks; every API request is mocked. No production writes.
async page => {
  const origin = 'http://127.0.0.1:5198';
  const errors = [];
  const onError = error => errors.push(error.message);
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const shown = locator => locator.waitFor({ state: 'visible', timeout: 5000 });
  const hidden = locator => locator.waitFor({ state: 'hidden', timeout: 5000 });
  const checks = [];
  await page.unroute('**/api/**');
  const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true, empty: true };
  page.on('pageerror', onError);
  await page.route('**/api/**', async route => {
    const path = route.request().url().replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    if (!path.startsWith('/api/')) return route.continue();
    if (route.request().method() !== 'GET') {
      errors.push('Unexpected mutation: ' + path);
      return route.abort();
    }
    let body = [];
    if (path === '/api/users/me') body = { code: 200, data: null };
    else if (path === '/api/animals' || path === '/api/shelters/discovery') body = emptyPage;
    else if (path.endsWith('/stats/today')) body = { rescuedToday: 0 };
    else if (path === '/api/places/regions') body = { items: [] };
    else if (path.includes('/posts')) body = { code: 200, data: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.mouse.move(0, 0);
    await page.goto(origin);
    await page.evaluate(() => localStorage.removeItem('auth-storage'));
    await page.reload();
    const desktop = page.getByRole('navigation', { name: '주 메뉴', exact: true });
    const button = desktop.getByRole('button', { name: '보호동물', exact: true });
    const panel = page.locator('#protected-animal-navigation');
    const links = panel.getByRole('link');
    check(!await panel.isVisible(), 'Menu must start closed');
    check(await button.locator('svg').count() === 0, 'Disclosure icon must be absent');
    check(await desktop.getByRole('link', { name: '보호동물 검색', exact: true }).count() === 0, 'No duplicate parent search link');
    checks.push('category button without split link or icon');

    await button.hover();
    await page.waitForTimeout(100); // Deliberately verify the 300ms hover intent boundary.
    check(!await panel.isVisible(), 'Menu opened before hover intent delay');
    await page.mouse.move(0, 0);
    await page.waitForTimeout(350);
    check(!await panel.isVisible(), 'Canceled hover timer reopened menu');
    await button.hover();
    await shown(panel);
    check(await button.getAttribute('aria-expanded') === 'true', 'aria-expanded must reflect open state');
    const first = await links.nth(0).boundingBox();
    const last = await links.nth(2).boundingBox();
    check(first && last && Math.abs(first.y - last.y) < 1 && last.x > first.x, 'Desktop links must be three columns');
    await page.mouse.move(last.x + 30, last.y + 30, { steps: 12 });
    await page.waitForTimeout(350);
    check(await panel.isVisible(), 'Menu closed during diagonal movement into panel');
    await page.mouse.move(5, 700);
    await hidden(panel);
    checks.push('hover intent, canceled timer, horizontal layout, diagonal movement and hover close');

    await button.focus();
    await page.keyboard.press('Enter');
    await shown(panel);
    await page.mouse.move(5, 700);
    await page.waitForTimeout(350);
    check(await panel.isVisible(), 'Explicit activation closed on pointer leave');
    await page.keyboard.press('Tab');
    check(await links.first().evaluate(el => el === document.activeElement), 'First Tab should focus first destination');
    const focus = await links.first().evaluate(el => getComputedStyle(el).outlineStyle);
    check(focus !== 'none', 'Keyboard destination must show focus outline');
    await page.keyboard.press('Shift+Tab');
    check(await button.evaluate(el => el === document.activeElement), 'Shift+Tab should return to trigger');
    await page.keyboard.press('Escape');
    await hidden(panel);
    check(await button.evaluate(el => el === document.activeElement), 'Escape should restore trigger focus');
    await page.keyboard.press('Space');
    await shown(panel);
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
    await hidden(panel);
    check(await desktop.getByRole('link', { name: '실종동물 찾기', exact: true }).evaluate(el => el === document.activeElement), 'Tab must exit into next top-level link');
    await button.focus();
    await page.keyboard.press('Space');
    await shown(panel);
    await page.keyboard.press('Space');
    await hidden(panel);
    checks.push('Enter, Space, Tab, Shift+Tab, Escape, focus ring and explicit-open retention');

    await button.click();
    await shown(panel);
    await button.click();
    await hidden(panel);
    await page.mouse.move(0, 0);
    await button.hover();
    await shown(panel);
    await button.click(); // A click pins an already hover-open menu.
    await page.mouse.move(5, 700);
    await page.waitForTimeout(350);
    check(await panel.isVisible(), 'Click did not pin hover-open menu');
    await page.mouse.click(5, 700);
    await hidden(panel);
    await button.click();
    await shown(panel);
    await links.nth(1).click();
    check(page.url() === origin + '/shelters', 'Shelter route failed');
    await hidden(panel);
    await button.click();
    await shown(panel);
    check(await links.nth(1).getAttribute('aria-current') === 'page', 'Current destination must be identified');
    check(await links.nth(1).getAttribute('aria-describedby'), 'Description must be separately associated');
    await links.first().click();
    check(page.url() === origin + '/animals', 'Animal search route failed');
    checks.push('click toggle, hover pinning, outside click, route close and current destination');

    for (const width of [1920, 1440, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await button.click();
      await shown(panel);
      check(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), width + 'px overflow');
      await page.mouse.move(width / 2, 110);
      await page.screenshot({ path: '/tmp/paw-nav-v31-local-' + width + '.png' });
      check(await panel.isVisible(), 'Desktop render must capture the open panel');
      await page.keyboard.press('Escape');
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await button.click();
    await shown(panel);
    await page.keyboard.press('Escape');
    await hidden(panel);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    checks.push('1920/1440/1280px render and reduced motion');

    await button.click();
    await shown(panel);
    await page.setViewportSize({ width: 390, height: 844 });
    const menuButton = page.getByRole('button', { name: '메뉴 열기', exact: true });
    const mobile = page.getByRole('navigation', { name: '모바일 메뉴', exact: true });
    await menuButton.click();
    await shown(mobile);
    check(await mobile.getByRole('button', { name: /보호동물/ }).count() === 0, 'Mobile group must not be collapsible');
    check(await mobile.getByRole('heading', { name: '보호동물', exact: true }).count() === 1, 'Mobile group heading missing');
    const mobileLinks = page.locator('#protected-animal-mobile-navigation').getByRole('link');
    check(await mobileLinks.count() === 3, 'All three mobile destinations must be visible');
    for (const link of await mobileLinks.all()) {
      const rect = await link.boundingBox();
      check(rect && rect.height >= 44, 'Mobile target height below 44px');
    }
    await page.screenshot({ path: '/tmp/paw-nav-v31-local-mobile.png', fullPage: true });
    await page.keyboard.press('Escape');
    await hidden(mobile);
    check(await menuButton.evaluate(el => el === document.activeElement), 'Mobile Escape focus not restored');
    await menuButton.click();
    await mobileLinks.nth(2).click();
    check(page.url() === origin + '/animals/stats', 'Mobile stats route failed');
    await hidden(mobile);
    await menuButton.click();
    await page.mouse.click(5, 800);
    await hidden(mobile);
    checks.push('mobile direct destinations, targets, Escape focus, outside click and route close');

    for (const width of [640, 320]) {
      await page.setViewportSize({ width, height: 400 });
      await menuButton.click();
      await shown(mobile);
      check(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), width + 'px overflow');
      check(await mobile.evaluate(el => el.scrollHeight > el.clientHeight), 'Short viewport must scroll menu internally');
      await mobile.getByRole('link', { name: '커뮤니티', exact: true }).scrollIntoViewIfNeeded();
      await page.keyboard.press('Escape');
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await menuButton.click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await hidden(panel);
    await page.setViewportSize({ width: 390, height: 844 });
    await hidden(mobile);
    checks.push('640/320px reflow, internal scrolling, breakpoint state reset');
    check(errors.length === 0, errors.join('\n'));
    return { checks, pageErrors: errors, scope: 'mocked local API; no production data changed' };
  } catch (error) {
    throw new Error('Completed: ' + checks.join('; ') + '\n' + error.message);
  } finally {
    page.off('pageerror', onError);
    await page.unroute('**/api/**');
  }
}
