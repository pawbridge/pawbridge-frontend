// Form fields on mocked data: every field is named by its visible label (clicking the label focuses the field),
// fields without a visible label carry a name, and personal-data fields tell the browser what to autofill.
async page => {
  const origin = 'http://127.0.0.1:5267';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  const product = { productId: 1, name: '검수 상품', description: '검수용 상품', imageUrl: '', status: 'ACTIVE', skus: [
    { skuId: 11, skuCode: 'TEST-S', options: { 크기: 'S' }, price: 10000, stockQuantity: 10, optionValueIds: [] },
    { skuId: 12, skuCode: 'TEST-L', options: { 크기: 'L' }, price: 20000, stockQuantity: 10, optionValueIds: [] },
  ] };
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  await page.route('**/*', async route => {
    const request = route.request();
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(request.url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    // The checkout page loads the address search script on arrival; a stub keeps the page offline.
    if (hostname === 't1.daumcdn.net') return route.fulfill({ contentType: 'text/javascript', body: 'window.daum = { Postcode: class { open() {} } };' });
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/') || !['xhr', 'fetch'].includes(request.resourceType())) return route.continue();
    if (path === '/api/v1/products/1') return route.fulfill({ json: product });
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });
  const field = (label, options = { exact: true }) => page.getByLabel(label, options);
  const autocomplete = async (label, value, name) => assert(await field(label).getAttribute('autocomplete') === value, name);
  // Clicking the visible label text moves focus into its field.
  const labelFocuses = async (text, name) => {
    await page.locator('label').filter({ hasText: text }).first().click({ position: { x: 4, y: 4 } });
    assert(await field(text).evaluate(element => element === document.activeElement), name);
  };
  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: 1080 });
    // Product detail: option buttons sit in a group named by the option, quantity controls have names.
    await page.goto(origin + '/products/1');
    await page.getByRole('group', { name: '크기' }).waitFor();
    assert(await page.getByRole('group', { name: '크기' }).getByRole('button').count() === 2, `option-group-${width}`);
    assert(await field('수량').inputValue() === '1', `quantity-named-${width}`);
    await page.getByRole('button', { name: '수량 늘리기', exact: true }).click();
    assert(await field('수량').inputValue() === '2', `quantity-increase-named-${width}`);
  }
  // Checkout (signed in): shipping fields are labelled and use the shipping autofill section.
  await page.evaluate(() => localStorage.setItem('auth-storage', JSON.stringify({ state: { user: { id: 7, name: '검수 회원', role: 'ROLE_ADMIN', email: 'member@example.invalid' }, accessToken: 'test-only-token', refreshToken: null }, version: 0 })));
  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto(origin + '/products/1');
    await page.getByRole('button', { name: '바로 구매', exact: true }).click();
    await page.waitForURL('**/checkout');
    await field('받는 사람 이름', { exact: false }).waitFor();
    for (const [label, value] of [['받는 사람 이름', 'shipping name'], ['연락처', 'shipping tel'], ['상세주소', 'shipping address-line2']]) {
      assert(await field(label, { exact: false }).getAttribute('autocomplete') === value, `checkout-${value}-${width}`);
    }
    assert(await field('배송 주소', { exact: false }).count() === 1 && await field('배송 메모').count() === 1, `checkout-address-memo-labelled-${width}`);
    await page.locator('label').filter({ hasText: '받는 사람 이름' }).click({ position: { x: 4, y: 4 } });
    assert(await field('받는 사람 이름', { exact: false }).evaluate(element => element === document.activeElement), `checkout-label-focuses-${width}`);
  }
  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
