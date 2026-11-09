// 모의 API로 상세 화면이 "없는 자원"일 때만 robots를 noindex로 바꾸는지 본다.
// Worker는 주소만 보고 index를 주므로, 없는 동물이나 글 상세가 구글에서 Soft 404로 잡히던 문제를 막는다.
// 일시적인 오류(503)에는 noindex를 넣지 않아야 살아 있는 페이지가 색인에서 빠지지 않는다.
async page => {
  const origin = 'http://127.0.0.1:5275';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/*', async route => {
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(route.request().url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/')) return route.continue();
    if (path === '/api/v1/animals/404') return route.fulfill({ status: 404, json: { message: '동물을 찾을 수 없습니다.' } });
    if (path === '/api/v1/animals/503') return route.fulfill({ status: 503, json: { message: '잠시 후 다시 시도해 주세요.' } });
    if (path === '/api/v1/posts/read/404') return route.fulfill({ status: 404, json: { message: '게시글을 찾을 수 없습니다.' } });
    if (path === '/api/v1/products/404') return route.fulfill({ status: 400, json: { message: '입력값이 올바르지 않습니다.' } });
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });

  const robots = () => page.locator('meta[name="robots"]').getAttribute('content');
  const waitRobots = (expected, name) =>
    page.waitForFunction(value => document.querySelector('meta[name="robots"]')?.getAttribute('content') === value, expected)
      .then(() => assert(true, name), async () => assert(false, `${name}: ${await robots()}`));

  await page.goto(origin + '/animals/404');
  await waitRobots('noindex,nofollow', 'missing-animal-noindex');
  assert((await page.title()).startsWith('페이지를 찾을 수 없습니다'), 'missing-animal-title: ' + await page.title());

  await page.goto(origin + '/community/404');
  await waitRobots('noindex,nofollow', 'missing-post-noindex');

  await page.goto(origin + '/products/abc');
  await waitRobots('noindex,nofollow', 'invalid-product-noindex');

  // 운영 API는 없는 상품에 400(C001)을 준다.
  await page.goto(origin + '/products/404');
  await waitRobots('noindex,nofollow', 'missing-product-noindex');

  await page.goto(origin + '/shelters/not-a-registration');
  await waitRobots('noindex,nofollow', 'invalid-shelter-noindex');

  // 일시적인 서버 오류는 noindex로 바꾸지 않는다. 재시도까지 끝나 오류 화면이 뜬 뒤에도 index여야 한다.
  await page.goto(origin + '/animals/503');
  await page.waitForResponse(response => response.url().endsWith('/api/v1/animals/503'));
  await page.waitForResponse(response => response.url().endsWith('/api/v1/animals/503'));
  await page.waitForTimeout(300);
  assert(await robots() === 'index,follow', 'server-error-stays-indexed: ' + await robots());
  assert((await page.title()) === '보호 동물 상세 | 포우브릿지', 'server-error-title: ' + await page.title());

  // 없는 상세에서 앱 안에서 목록으로 나가면 목록의 index가 돌아와야 한다.
  await page.goto(origin + '/animals/404');
  await waitRobots('noindex,nofollow', 'missing-animal-noindex-again');
  await page.evaluate(() => { window.history.pushState({}, '', '/animals'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await waitRobots('index,follow', 'list-after-missing-indexed');
  assert((await page.title()) === '보호 동물 검색 | 포우브릿지', 'list-title-restored: ' + await page.title());

  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return { checks };
}
