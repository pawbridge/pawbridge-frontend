// Run with Playwright CLI against a local Vite server on port 5198.
// API responses are mocked; no production requests or writes are made.
async page => {
  const origin = 'http://127.0.0.1:5198';
  const errors = [];
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  await page.unroute('**/api/**');
  const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true, empty: true };
  await page.route('**/api/**', async route => {
    const path = route.request().url().replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    if (!path.startsWith('/api/')) return route.continue();
    if (route.request().method() !== 'GET') throw new Error(`Unexpected mutation: ${path}`);
    let body = [];
    if (path === '/api/users/me') body = { code: 200, data: null };
    else if (path === '/api/animals' || path === '/api/shelters/discovery') body = emptyPage;
    else if (path.endsWith('/stats/today')) body = { rescuedToday: 0 };
    else if (path.endsWith('/stats/status') || path.endsWith('/stats/regional')) body = [];
    else if (path === '/api/places/regions') body = { items: [] };
    else if (path.includes('/posts')) body = { code: 200, data: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.mouse.move(0, 0);
  await page.evaluate(() => localStorage.removeItem('auth-storage'));
  await page.goto(origin);
  const desktop = page.getByRole('navigation', { name: '주 메뉴' });
  const desktopButton = desktop.getByRole('button', { name: '보호동물 관련 메뉴' });
  const desktopPanel = page.locator('#protected-animal-navigation');
  const visible = async (locator, step) => {
    try { await locator.waitFor({ state: 'visible', timeout: 5000 }); }
    catch { throw new Error(`${step}: menu did not open`); }
  };
  if (await desktopPanel.isVisible()) throw new Error('Desktop menu should start closed');
  await desktop.getByRole('link', { name: '보호동물 검색', exact: true }).hover();
  await visible(desktopPanel, 'desktop hover');
  await desktopPanel.getByRole('link', { name: /보호소 찾기/ }).click();
  if (!page.url().endsWith('/shelters')) throw new Error('Shelter navigation failed');
  await desktopPanel.waitFor({ state: 'hidden' });
  await page.mouse.move(0, 0);
  await desktopButton.focus();
  await page.keyboard.press('Enter');
  await visible(desktopPanel, 'desktop keyboard');
  await page.keyboard.press('Escape');
  await desktopPanel.waitFor({ state: 'hidden' });
  if (!await desktopButton.evaluate(button => button === document.activeElement)) throw new Error('Escape did not restore button focus');
  await desktopButton.click();
  await visible(desktopPanel, 'desktop pointer');
  await desktopButton.click();
  await desktopPanel.waitFor({ state: 'hidden' });
  await desktopButton.click();
  await visible(desktopPanel, 'desktop pointer reopen');
  await page.locator('header a[href="/"]').click();
  await desktopPanel.waitFor({ state: 'hidden' });
  await desktop.getByRole('link', { name: '보호동물 검색', exact: true }).click();
  if (!page.url().endsWith('/animals')) throw new Error('Primary animal search link failed');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  const mobile = page.getByRole('navigation', { name: '모바일 메뉴' });
  const mobileButton = mobile.getByRole('button', { name: '보호동물 관련 메뉴' });
  const mobilePanel = page.locator('#protected-animal-mobile-navigation');
  await visible(mobilePanel, 'mobile initial');
  const bounds = await mobileButton.boundingBox();
  if (!bounds || bounds.width < 44 || bounds.height < 44) throw new Error('Mobile menu button target is too small');
  await mobileButton.click();
  await mobilePanel.waitFor({ state: 'hidden' });
  await mobileButton.click();
  await visible(mobilePanel, 'mobile expand');
  await mobilePanel.getByRole('link', { name: /유기동물 현황/ }).click();
  if (!page.url().endsWith('/animals/stats')) throw new Error('Statistics navigation failed');
  if (await mobile.isVisible()) throw new Error('Mobile menu remained open after navigation');
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile horizontal overflow');
  await page.setViewportSize({ width: 320, height: 400 });
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('320px mobile horizontal overflow');
  if (!await mobile.evaluate(nav => nav.scrollHeight > nav.clientHeight)) throw new Error('Small-screen menu should scroll internally');
  await mobile.getByRole('link', { name: '보호동물 검색', exact: true }).click();
  if (!page.url().endsWith('/animals')) throw new Error('Mobile primary animal search link failed');

  page.off('pageerror', onError);
  await page.unroute('**/api/**');
  if (errors.length) throw new Error(errors.join('\n'));
  return { checks: ['desktop hover', 'nested navigation', 'keyboard Enter/Escape and focus', 'outside click', 'primary link', 'mobile accordion and touch target', 'mobile routes, 320px overflow and scrolling'], pageErrors: errors };
}
