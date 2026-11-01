// Synthetic API/auth only. Posts and reports by a blocked member stay folded until explicitly expanded,
// anonymous pages never ask for block data, and a failed block lookup folds everything but the viewer's own posts.
async (page, origin = 'http://127.0.0.1:5188') => {
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) throw new Error('Loopback test origin required');
  const me = 1, blockedMember = 2, other = 3;
  const visit = path => page.goto(origin + path, { waitUntil: 'domcontentloaded' });
  const post = (id, authorId, boardType, title) => ({
    id, postId: id, title, content: `${title} 본문`, boardType, authorId, authorName: `합성 회원 ${authorId}`, imageUrls: [], createdAt: '2026-10-11T01:00:00Z',
  });
  const posts = [
    post(51, blockedMember, 'COMMUNICATION', '합성 차단 글 소통'),
    post(52, blockedMember, 'PROTECTION', '합성 차단 글 보호'),
    post(53, me, 'COMMUNICATION', '합성 본인 글'),
  ];
  const report = (id, authorId, kind = 'MISSING') => ({
    reportId: id, authorId, authorNickname: '합성 작성자', kind, title: `합성 제보 ${id}`,
    occurredOn: '2026-10-11', region: '서울', description: `합성 본문 ${id}`,
    imageUrls: ['/contact/avatar-background.svg'], species: '고양이', createdAt: '2026-10-11T01:00:00Z',
  });
  const reports = [report(923, blockedMember), report(924, other), report(925, blockedMember, 'SIGHTING')];
  let blocked = true;
  let statusFails = false;
  let statusReads = 0;
  const errors = [];
  const recordError = error => errors.push(error.message);
  const handler = async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.startsWith('/api/v1/')) return url.origin === origin ? route.continue() : route.abort();
    const path = url.pathname;
    let data = { content: [], nextCursor: null, unreadCount: 0, totalPages: 0, totalElements: 0 };
    if (path.includes('ticket')) return route.fulfill({ status: 503, json: { message: 'Synthetic stream disabled' } });
    if (path === '/api/v1/auth/refresh') return route.fulfill({ status: 401, json: { code: 401, data: null, message: '로그인 유지 정보가 없습니다.' } });
    if (path === '/api/v1/notes/blocks/status') {
      statusReads++;
      if (statusFails) return route.fulfill({ status: 503, json: { message: 'synthetic failure' } });
      data = { memberIds: blocked ? [blockedMember] : [] };
    }
    if (path === `/api/v1/notes/blocks/${blockedMember}`) {
      blocked = request.method() === 'PUT';
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/v1/notes/blocks') data = { content: blocked ? [{ memberId: blockedMember, nickname: '합성 회원 2', createdAt: '2026-10-11T01:00:00Z' }] : [], totalPages: 1 };
    if (path === '/api/v1/posts/read') data = posts;
    const postId = /^\/api\/v1\/posts\/read\/(\d+)$/.exec(path);
    if (postId) data = posts.find(item => item.id === Number(postId[1]));
    if (path.startsWith('/api/v1/comments/posts/read/')) data = [];
    if (path.startsWith('/api/v1/reports')) {
      const id = Number(path.split('/').pop());
      data = Number.isSafeInteger(id) && id > 0 ? reports.find(item => item.reportId === id)
        : { content: reports.filter(item => item.kind === (url.searchParams.get('kind') || 'MISSING')), totalPages: 1 };
    }
    try { return await route.fulfill({ json: { code: 200, data } }); }
    catch (error) { if (!request.failure() && !/already handled|closed/.test(error.message)) throw error; }
  };
  const absent = async text => {
    if (await page.getByText(text, { exact: true }).count()) throw new Error(`Blocked text exposed before expansion: ${text}`);
  };
  await page.route('**/*', handler);
  page.on('pageerror', recordError);
  try {
    // Anonymous visitors see public lists without any private block lookup.
    await visit('/reports/missing');
    await page.getByRole('heading', { name: '합성 제보 923', exact: true }).waitFor();
    if (statusReads) throw new Error('Anonymous page requested private block data');

    await page.evaluate(user => localStorage.setItem('auth-storage', JSON.stringify({
      state: { user, accessToken: 'synthetic-test-token', refreshToken: null }, version: 0,
    })), { id: me, name: '합성 사용자', role: 'ROLE_USER' });

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
      await visit(`/community/${posts[0].id}`);
      await page.getByText('차단한 회원의 글입니다.', { exact: true }).waitFor();
      await absent(posts[0].title);
      await page.getByRole('button', { name: '이 글 보기', exact: true }).click();
      await page.getByRole('heading', { name: posts[0].title, exact: true }).waitFor();
      for (const [kind, id] of [['missing', 923], ['sightings', 925]]) {
        await visit(`/reports/${kind}`);
        await page.getByText('차단한 회원의 글입니다.', { exact: true }).waitFor();
        await absent(`합성 제보 ${id}`);
        if (kind === 'missing') await page.getByRole('heading', { name: '합성 제보 924', exact: true }).waitFor();
        await page.getByRole('button', { name: '이 글 보기', exact: true }).click();
        await page.getByRole('heading', { name: `합성 제보 ${id}`, exact: true }).waitFor();
        await visit(`/reports/${id}`);
        await page.getByText('차단한 회원의 글입니다.', { exact: true }).waitFor();
        await absent(`합성 본문 ${id}`);
        await page.getByRole('button', { name: '이 글 보기', exact: true }).click();
        await page.getByText(`합성 본문 ${id}`, { exact: true }).waitFor();
      }
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Overflow at ${width}`);
    }

    // A failed block lookup folds other members' posts but keeps the viewer's own, and retry recovers.
    statusFails = true;
    await visit('/community');
    await page.getByText('차단 여부를 확인하지 못했어요.', { exact: true }).first().waitFor();
    await page.getByText(posts[2].title, { exact: true }).waitFor();
    await absent(posts[0].title);
    await visit('/reports/missing');
    await page.getByText('차단 여부를 확인하지 못했어요.', { exact: true }).first().waitFor();
    await absent('합성 제보 923');
    statusFails = false;
    await page.getByRole('button', { name: '다시 시도', exact: true }).first().click();
    await page.getByText('차단한 회원의 글입니다.', { exact: true }).waitFor();

    // Unblocking refreshes the cached status; the report is no longer folded.
    await visit('/notes/blocks');
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '차단 해제', exact: true }).first().click();
    await page.getByText('차단한 회원이 없습니다.', { exact: true }).waitFor();
    await visit('/reports/missing');
    await page.getByRole('heading', { name: '합성 제보 923', exact: true }).waitFor();
    if (await page.getByText('차단한 회원의 글입니다.', { exact: true }).count()) throw new Error('Unblock left stale folded content');
    if (errors.length) throw new Error(`Uncaught page errors: ${errors.join('; ')}`);
    return ['anonymous-no-block-lookup', 'community-list-tab-detail-folded', 'report-list-detail-folded', 'explicit-expansion', 'desktop-mobile', 'own-post-during-status-failure', 'failure-retry', 'unblock-refresh'];
  } finally {
    page.off('pageerror', recordError);
    await page.unroute('**/*', handler);
  }
}
