// Real dev login, posts and block-status APIs. Public report fixtures are synthesized; no R2/Animal writes.
async (page, accounts, origin = 'http://127.0.0.1:5184') => {
  const api = 'http://localhost:28080';
  const headers = { Authorization: `Bearer ${accounts[0].token}` };
  const runId = Date.now().toString(36);
  const visit = path => page.goto(origin + path, { waitUntil: 'domcontentloaded' });
  const request = async (method, path, options = {}) => {
    const response = await page.request[method](api + path, { headers, ...options });
    if (!response.ok()) throw new Error(`Local fixture request failed: ${method} ${path} ${response.status()}`);
    return response;
  };
  const report = (id, authorId, kind = 'MISSING') => ({
    reportId: id, authorId, authorNickname: '합성 작성자', kind, title: `합성 제보 ${id}`,
    occurredOn: '2026-10-11', region: '서울', description: `합성 본문 ${id}`,
    imageUrls: ['/contact/avatar-background.svg'], species: '고양이', createdAt: '2026-10-11T01:00:00Z',
  });
  const reports = [report(923, accounts[1].userId), report(924, accounts[2].userId), report(925, accounts[1].userId, 'SIGHTING')];
  const handler = route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/reports')) return route.continue();
    const id = Number(url.pathname.split('/').pop());
    const data = Number.isSafeInteger(id) && id > 0 ? reports.find(item => item.reportId === id)
      : { content: reports.filter(item => item.kind === (url.searchParams.get('kind') || 'MISSING')), totalPages: 1 };
    return route.fulfill({ json: { code: 200, data } });
  };
  await page.route('**/api/reports**', handler);
  let statusReads = 0;
  page.on('request', req => { if (new URL(req.url()).pathname === '/api/notes/blocks/status') statusReads++; });
  await visit('/reports/missing');
  await page.getByRole('heading', { name: '합성 제보 923', exact: true }).waitFor();
  if (statusReads) throw new Error('Anonymous page requested private block data');

  const posts = [];
  for (const boardType of ['COMMUNICATION', 'PROTECTION']) {
    const response = await page.request.post(api + '/api/posts', {
      headers: { Authorization: `Bearer ${accounts[1].token}` },
      multipart: { title: `합성 차단 검증 ${boardType} ${runId}`, content: '접어야 하는 합성 본문', boardType },
    });
    if (!response.ok()) throw new Error(`Local public-post fixture failed: ${boardType} ${response.status()}`);
    posts.push((await response.json()).data);
  }
  const ownPost = await request('post', '/api/posts', {
    multipart: { title: `합성 본인 글 ${runId}`, content: '본인 글은 차단 조회 오류와 무관하게 표시', boardType: 'COMMUNICATION' },
  });
  const ownTitle = (await ownPost.json()).data.title;
  await request('put', `/api/notes/blocks/${accounts[1].userId}`);
  await visit('/login');
  await page.getByPlaceholder('이메일 주소를 입력하세요').fill(accounts[0].email);
  await page.getByPlaceholder('비밀번호를 입력하세요', { exact: true }).fill(accounts[0].password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await page.waitForURL(origin + '/', { waitUntil: 'domcontentloaded' });
  const absent = async text => {
    if (await page.getByText(text, { exact: true }).count()) throw new Error('Blocked text exposed before expansion');
  };
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await visit('/community');
    await page.getByText('차단한 회원의 글입니다.', { exact: true }).first().waitFor();
    await absent(posts[0].title);
    await page.getByRole('button', { name: '이 글 보기', exact: true }).first().click();
    await page.getByText(posts[0].title, { exact: true }).waitFor();
    await page.getByRole('button', { name: '보호 동물', exact: true }).click();
    await page.getByText('차단한 회원의 글입니다.', { exact: true }).first().waitFor();
    await absent(posts[1].title);
    await page.getByRole('button', { name: '이 글 보기', exact: true }).first().click();
    await page.getByText(posts[1].title, { exact: true }).waitFor();
    await visit(`/community/${posts[0].postId || posts[0].id}`);
    await page.getByText('차단한 회원의 글입니다.', { exact: true }).waitFor();
    await absent(posts[0].title);
    await page.getByRole('button', { name: '이 글 보기', exact: true }).click();
    await page.getByRole('heading', { name: posts[0].title, exact: true }).waitFor();
    for (const [path, id] of [['missing', 923], ['sightings', 925]]) {
      await visit(`/reports/${path}`);
      await page.getByText('차단한 회원의 글입니다.', { exact: true }).waitFor();
      await absent(`합성 제보 ${id}`);
      if (path === 'missing') await page.getByRole('heading', { name: '합성 제보 924', exact: true }).waitFor();
      await page.screenshot({ path: `/tmp/contact-blocked-${path}-${width}.png`, fullPage: true });
      await page.getByRole('button', { name: '이 글 보기', exact: true }).click();
      await page.getByRole('heading', { name: `합성 제보 ${id}`, exact: true }).waitFor();
      await visit(`/reports/${id}`);
      await page.getByText('차단한 회원의 글입니다.', { exact: true }).waitFor();
      await absent(`합성 본문 ${id}`);
      await page.getByRole('button', { name: '이 글 보기', exact: true }).click();
      await page.getByText(`합성 본문 ${id}`, { exact: true }).waitFor();
    }
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile overflow');
  }
  const statusRoute = '**/api/notes/blocks/status**';
  let fail = true;
  await page.route(statusRoute, route => fail ? route.fulfill({ status: 503, json: { message: 'synthetic failure' } }) : route.continue());
  await visit('/community');
  await page.getByText('차단 여부를 확인하지 못했어요.', { exact: true }).first().waitFor();
  await page.getByText(ownTitle, { exact: true }).waitFor();
  await absent(posts[0].title);
  await visit('/reports/missing');
  await page.getByText('차단 여부를 확인하지 못했어요.', { exact: true }).first().waitFor();
  await absent('합성 제보 923');
  fail = false;
  await page.getByRole('button', { name: '다시 시도', exact: true }).first().click();
  await page.getByText('차단한 회원의 글입니다.', { exact: true }).waitFor();
  await page.unroute(statusRoute);
  await visit('/notes/blocks');
  await page.getByRole('button', { name: '차단 해제', exact: true }).first().click();
  await page.getByText('차단한 회원이 없습니다.', { exact: true }).waitFor();
  await visit('/reports/missing');
  await page.getByRole('heading', { name: '합성 제보 923', exact: true }).waitFor();
  if (await page.getByText('차단한 회원의 글입니다.', { exact: true }).count()) throw new Error('Unblock left stale folded content');
  await page.unroute('**/api/reports**', handler);
  return { environment: 'isolated-local-dev', checks: ['anonymous-public-access', 'real-login-and-directional-block-api', 'community-table-grid-detail', 'report-list-detail-missing-sighting-fixtures', 'explicit-expansion', 'desktop-mobile', 'own-post-during-status-failure', 'failure-retry', 'unblock-cache-refresh'], mocked: ['public-report-data', 'status-failure-only'], productionVerified: false };
}
