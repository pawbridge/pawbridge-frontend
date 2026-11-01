// Product cards on mocked data: the link to the detail page is the product name and covers the whole card,
// and the cart button sits outside that link with its own name, so the two are separate controls.
async page => {
  const origin = 'http://127.0.0.1:5265';
  const checks = [], pageErrors = [], cartRequests = [], dialogs = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  const item = (id, totalStock) => ({ id, skuId: 100 + id, name: `검수 상품 ${id}`, optionName: '기본', price: 12000 * id, totalStock, imageUrl: '', status: 'ACTIVE' });
  const products = { items: [item(1, 5), item(2, 0)], totalCount: 2, currentPage: 0, totalPages: 1, hasNext: false };
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('dialog', dialog => { dialogs.push(dialog.message()); return dialog.accept(); });
  await page.route('**/*', async route => {
    const request = route.request();
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(request.url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/') || !['xhr', 'fetch'].includes(request.resourceType())) return route.continue();
    if (path === '/api/v1/products' && request.method() === 'GET') return route.fulfill({ json: products });
    if (path === '/api/v1/carts/items' && request.method() === 'POST') {
      cartRequests.push(request.postDataJSON());
      return route.fulfill({ json: [] });
    }
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });
  const card = name => page.getByRole('link', { name, exact: true }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
  const openList = async () => {
    await page.goto(origin + '/products');
    await page.getByRole('link', { name: '검수 상품 2', exact: true }).waitFor();
  };
  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: 1080 });
    await openList();
    // No control inside another control, and each control has its own name.
    assert(await page.locator('a button, a a, button a').count() === 0, `no-nested-controls-${width}`);
    assert(await page.getByRole('link', { name: '검수 상품 1', exact: true }).count() === 1, `link-named-by-product-${width}`);
    const cartButton = page.getByRole('button', { name: '검수 상품 1 장바구니에 담기', exact: true });
    assert(await cartButton.count() === 1, `cart-button-named-${width}`);
    assert(await page.getByRole('button', { name: '검수 상품 2 장바구니에 담기', exact: true }).isDisabled(), `sold-out-button-disabled-${width}`);
    // The cart button adds to the cart without opening the detail page.
    const before = cartRequests.length;
    await Promise.all([
      page.waitForRequest(request => request.method() === 'POST' && request.url().endsWith('/api/v1/carts/items')),
      cartButton.click(),
    ]);
    assert(cartRequests.length === before + 1 && cartRequests.at(-1).skuId === 101, `cart-button-adds-${width}`);
    assert(new URL(page.url()).pathname === '/products', `cart-button-stays-${width}`);
    // Keyboard: the name link is reachable, the whole card shows the focus outline, the next Tab is the cart button.
    const link = page.getByRole('link', { name: '검수 상품 1', exact: true });
    let reached = false;
    for (let step = 0; step < 80 && !reached; step++) {
      await page.keyboard.press('Tab');
      reached = await link.evaluate(element => element === document.activeElement);
    }
    assert(reached, `tab-reaches-link-${width}`);
    assert(await card('검수 상품 1').evaluate(element => getComputedStyle(element).outlineStyle !== 'none'), `card-focus-outline-${width}`);
    await page.keyboard.press('Tab');
    assert(await cartButton.evaluate(element => element === document.activeElement), `tab-order-link-then-cart-${width}`);
    // A click anywhere else on the card (here the image area) still opens the detail page.
    // Mouse clicks use viewport coordinates, so bring the card into view first (the Tab walk may have scrolled away).
    await card('검수 상품 1').scrollIntoViewIfNeeded();
    const box = await card('검수 상품 1').boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + 40);
    await page.waitForURL('**/products/1');
    assert(true, `card-click-opens-detail-${width}`);
  }
  assert(dialogs.every(message => message === '장바구니에 추가되었습니다!'), 'cart-dialog-message');
  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
