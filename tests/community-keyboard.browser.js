// Community list on mocked data: each post title in the table is a real link, so a keyboard user can
// reach it with Tab and open it with Enter. Clicking anywhere on the row still opens the post, once.
async page => {
  const origin = 'http://127.0.0.1:5264';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  const post = id => ({ id, title: `검수 글 ${id}`, content: '검수 본문', boardType: 'COMMUNICATION', authorId: 70 + id, authorName: `작성자${id}`, imageUrls: [], createdAt: '2026-10-30T01:00:00Z' });
  const posts = [post(1), post(2)];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/*', async route => {
    const request = route.request();
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(request.url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/') || !['xhr', 'fetch'].includes(request.resourceType())) return route.continue();
    if (path === '/api/v1/posts/read') return route.fulfill({ json: { code: 200, message: 'OK', data: posts } });
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });
  const historyLength = () => page.evaluate(() => history.length);
  const openList = async () => {
    await page.goto(origin + '/community');
    await page.getByRole('link', { name: '검수 글 2', exact: true }).waitFor();
  };
  for (const width of [1920, 390]) {
    await page.setViewportSize({ width, height: 1080 });
    await openList();
    // Screen readers announce the title as a link with the post title as its name.
    assert(await page.getByRole('table').getByRole('link').count() === 2, `title-links-${width}`);
    // Tab reaches the title link and Enter opens the post.
    const target = page.getByRole('link', { name: '검수 글 2', exact: true });
    let reached = false;
    for (let step = 0; step < 80 && !reached; step++) {
      await page.keyboard.press('Tab');
      reached = await target.evaluate(element => element === document.activeElement);
    }
    assert(reached, `tab-reaches-title-${width}`);
    assert(await target.evaluate(element => element.matches(':focus-visible') && getComputedStyle(element).outlineStyle !== 'none'), `focus-outline-visible-${width}`);
    await page.keyboard.press('Enter');
    await page.waitForURL('**/community/2');
    assert(true, `enter-opens-post-${width}`);
    // A mouse click on the title opens the post with one history entry, not two.
    await openList();
    let before = await historyLength();
    await page.getByRole('link', { name: '검수 글 1', exact: true }).click();
    await page.waitForURL('**/community/1');
    assert(await historyLength() === before + 1, `title-click-one-entry-${width}`);
    // Clicking elsewhere on the row (the date cell) still opens the post.
    await openList();
    before = await historyLength();
    await page.getByRole('row', { name: /검수 글 2/ }).getByRole('cell').last().click();
    await page.waitForURL('**/community/2');
    assert(await historyLength() === before + 1, `row-click-opens-post-${width}`);
  }
  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
