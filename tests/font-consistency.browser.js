// Local Vite preview on 5198. API responses are mocked; no live login or writes.
// Google Fonts are real: this checks rendered fonts, not just CSS declarations.
async page => {
  const origin = 'http://127.0.0.1:5198';
  const checks = [];
  const errors = [];
  const check = (condition, label) => {
    if (!condition) throw new Error(label);
    checks.push(label);
  };
  const onError = error => errors.push(error.message);
  const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true, empty: true };
  const user = { id: 10, userId: 10, name: '테스트관리자', email: 'admin@example.invalid', role: 'ROLE_ADMIN', provider: 'LOCAL' };
  let admin = false;
  const mockApi = async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== 'GET') {
      errors.push('Unexpected mutation: ' + path);
      return route.abort();
    }
    let body = [];
    if (path === '/api/users/me') body = { code: 200, data: admin ? user : null };
    else if (path === '/api/products/1') body = { productId: 1, name: '글꼴 검증 상품', description: '테스트 상품 설명', status: 'ACTIVE', categoryId: 1, imageUrl: '', skus: [] };
    else if (path === '/api/categories') body = [{ categoryId: 1, name: '테스트 분류' }];
    else if (path === '/api/animals' || path === '/api/shelters/discovery') body = emptyPage;
    else if (path.endsWith('/stats/today')) body = { rescuedToday: 0 };
    else if (path === '/api/places/regions') body = { items: [{ code: '11', name: '서울' }] };
    else if (path.includes('/posts')) body = { code: 200, data: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  };
  const notoCss = '**/css2?family=Noto+Sans+KR*';
  const platformFonts = async selector => {
    const cdp = await page.context().newCDPSession(page);
    try {
      await cdp.send('DOM.enable');
      await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument');
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
      check(Boolean(nodeId), 'font sample exists: ' + selector);
      return (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts;
    } finally { await cdp.detach(); }
  };
  page.on('pageerror', onError);
  await page.route('**/api/**', mockApi);
  try {
    // A fresh page with delayed CSS must eventually use Noto instead of retaining fallback.
    await page.route(notoCss, async route => {
      const response = await route.fetch();
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({ response });
    });
    await page.goto(origin);
    await page.locator('header h2').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const fontLink = await page.locator('link[href*="family=Noto+Sans+KR"]').getAttribute('href');
    check(fontLink.includes('display=swap') && !fontLink.includes('Jakarta'), 'load only Noto with swap');
    const firstFonts = await platformFonts('header h2');
    check(firstFonts.some(font => font.isCustomFont && font.familyName.startsWith('Noto Sans KR')),
      'first visit applies real Noto after delayed stylesheet');
    await page.unroute(notoCss);

    const paths = ['/', '/animals', '/animals/lost', '/shelters', '/travel', '/adoption', '/community', '/login'];
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of paths) {
        await page.goto(origin + path);
        await page.locator('main, form').first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        for (const dark of [false, true]) {
          await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark);
          const styles = await page.evaluate(() => {
            const firstFamily = element => getComputedStyle(element).fontFamily.split(',')[0].replaceAll('"', '').trim();
            const text = [...document.querySelectorAll('body, h1, h2, p, a, button, input, select, textarea')]
              .filter(element => element.getClientRects().length && !element.closest('svg'));
            return { wrong: text.filter(element => firstFamily(element) !== 'Noto Sans KR').map(element => element.tagName),
              overflow: document.documentElement.scrollWidth > innerWidth };
          });
          check(styles.wrong.length === 0 && !styles.overflow, `${path} ${width}px ${dark ? 'dark' : 'light'}: family and overflow`);
        }
        await page.evaluate(() => document.documentElement.classList.remove('dark'));
        if (path !== '/login') {
          const header = await page.locator('header').first().evaluate(element => {
            const logo = getComputedStyle(element.querySelector('h2'));
            const action = getComputedStyle(element.querySelector('a[href="/signup"]'));
            return { logo: [logo.fontSize, logo.fontWeight, logo.lineHeight, logo.letterSpacing],
              action: [action.fontSize, action.fontWeight, action.lineHeight, action.letterSpacing] };
          });
          check(header.logo.join('|') === '18px|400|30px|normal' && header.action.join('|') === '14px|500|20px|normal',
            `${path} ${width}px: SHYU logo and action typography`);
        }
      }
    }
    // The existing ProductEdit font-sans override must use the same real font too.
    admin = true;
    await page.evaluate(user => localStorage.setItem('auth-storage', JSON.stringify({ state: { user, accessToken: 'test-only-token' }, version: 0 })), user);
    await page.goto(origin + '/admin/products/1/edit');
    await page.getByRole('heading', { name: '상품 수정', exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    check(await page.locator('.font-sans').count() > 0, 'existing administrator font-sans page exercised');
    const adminFonts = await platformFonts('.font-sans main h1');
    check(adminFonts.some(font => font.isCustomFont && font.familyName.startsWith('Noto Sans KR')), 'administrator font-sans renders real Noto');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(origin);
    await page.locator('header a[href="/admin/dashboard"]').waitFor();
    for (const selector of ['header a[href="/admin/dashboard"]', 'header button:has-text("로그아웃")']) {
      const weight = await page.locator(selector).first().evaluate(element => getComputedStyle(element).fontWeight);
      check(weight === '500', 'signed-in header action uses medium: ' + selector);
    }

    // Font download failure keeps text readable; do not require the web font offline.
    admin = false;
    await page.evaluate(() => localStorage.removeItem('auth-storage'));
    await page.route(notoCss, route => route.abort());
    await page.goto(origin);
    await page.locator('header h2').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const fallbackFonts = await platformFonts('header h2');
    check(fallbackFonts.some(font => !font.isCustomFont && font.glyphCount > 0), 'font failure renders readable system fallback');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'font failure does not overflow');
    check(errors.length === 0, 'no application exceptions or attempted mutations');
    return { count: checks.length, checks, apiMock: true, realFontDownload: true, errors, productionDeployment: false };
  } finally {
    page.off('pageerror', onError);
    await page.unroute('**/api/**', mockApi);
    await page.unroute(notoCss);
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
  }
}
