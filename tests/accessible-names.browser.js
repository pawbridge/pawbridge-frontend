// Accessible names on mocked data. Material Symbols draw icons from ligature text such as "edit", which screen
// readers used to read as part of a button name ("edit 글쓰기"). Icons are hidden from them, and buttons that
// show only an icon carry their own name.
async page => {
  const origin = 'http://127.0.0.1:5266';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  const post = id => ({ id, title: `검수 글 ${id}`, content: '검수 본문', boardType: 'COMMUNICATION', authorId: 70 + id, authorName: `작성자${id}`, imageUrls: [], createdAt: '2026-10-30T01:00:00Z' });
  const product = id => ({ id, skuId: 100 + id, name: `검수 상품 ${id}`, price: 10000, totalStock: 3, imageUrl: '', status: 'ACTIVE' });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  await page.route('**/*', async route => {
    const request = route.request();
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(request.url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/') || !['xhr', 'fetch'].includes(request.resourceType())) return route.continue();
    if (path === '/api/v1/posts/read') return route.fulfill({ json: { code: 200, message: 'OK', data: [post(1), post(2)] } });
    if (path === '/api/v1/auth/password/reset-request') return route.fulfill({ json: { code: 200, message: 'OK', data: null } });
    if (path === '/api/v1/products') return route.fulfill({ json: { items: [product(1), product(2)], totalCount: 30, currentPage: 0, totalPages: 3, hasNext: true } });
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });
  // The icon names the app uses are listed in index.html (Google Fonts icon_names); none may appear in the accessibility tree.
  const html = await (await page.request.get(origin + '/')).text();
  const iconNames = html.match(/icon_names=([a-z0-9_,]+)/)[1].split(',');
  const leakedIcons = async () => {
    const tree = await page.locator('body').ariaSnapshot();
    return iconNames.filter(name => new RegExp(`(^|[^a-z_])${name}([^a-z_]|$)`).test(tree));
  };
  const routes = [
    ['/', () => page.getByRole('banner').waitFor()],
    ['/community', () => page.getByText('검수 글 2').waitFor()],
    ['/products', () => page.getByText('검수 상품 2').first().waitFor()],
    ['/login', () => page.getByRole('button', { name: /이메일로 로그인$/ }).first().waitFor()],
  ];
  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: 1080 });
    for (const [path, ready] of routes) {
      await page.goto(origin + path);
      await ready();
      await page.waitForTimeout(300);
      const leaked = await leakedIcons();
      assert(leaked.length === 0, `no-icon-text-${path}-${width}: ${leaked.join(',')}`);
    }
  }
  // A button with an icon and text is named by its text only.
  await page.goto(origin + '/community');
  await page.getByText('검수 글 2').waitFor();
  assert(await page.getByRole('button', { name: '글쓰기', exact: true }).count() === 1, 'write-button-named-by-text');
  // Icon-only buttons have names.
  await page.goto(origin + '/products');
  await page.getByText('검수 상품 2').first().waitFor();
  assert(await page.getByRole('button', { name: '이전 페이지', exact: true }).count() === 1, 'previous-page-named');
  assert(await page.getByRole('button', { name: '다음 페이지', exact: true }).count() === 1, 'next-page-named');
  // Password toggles say what they will do and change with the state.
  await page.goto(origin + '/reset-password');
  await page.getByPlaceholder('이메일 주소를 입력하세요').fill('member@example.invalid');
  await page.getByPlaceholder('이메일 주소를 입력하세요').press('Enter');
  await page.getByPlaceholder('새 비밀번호를 입력하세요').waitFor();
  assert((await leakedIcons()).length === 0, 'no-icon-text-reset-password-step-2');
  const toggle = page.getByRole('button', { name: '새 비밀번호 보기', exact: true });
  await toggle.click();
  assert(await page.getByRole('button', { name: '새 비밀번호 숨기기', exact: true }).count() === 1, 'reset-toggle-name-follows-state');
  assert(await page.getByRole('button', { name: '비밀번호 확인 보기', exact: true }).count() === 1, 'reset-confirm-toggle-named');
  await page.goto(origin + '/login');
  await page.getByRole('button', { name: /이메일로 로그인$/ }).first().click();
  assert((await leakedIcons()).length === 0, 'no-icon-text-login-email-form');
  await page.getByRole('button', { name: '비밀번호 보기', exact: true }).click();
  assert(await page.getByRole('button', { name: '비밀번호 숨기기', exact: true }).count() === 1, 'login-toggle-name-follows-state');
  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
