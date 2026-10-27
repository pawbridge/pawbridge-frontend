// Local Vite only. API/auth are synthetic; no live requests, accounts or payments.
async (page, origin = 'http://127.0.0.1:5260') => {
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) throw new Error('Loopback test origin required');
  const errors = [], unexpected = [], probes = [], checks = [];
  let publicAssetsMocked = 0;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
  let validLogin = false;
  const recordError = error => errors.push(error.message);
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const handler = async route => {
    const request = route.request(), url = new URL(request.url());
    if (!url.pathname.startsWith('/api/v1/')) {
      if (url.origin === origin || url.protocol === 'data:') return route.continue();
      if (request.method() === 'GET' && (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)
        || (url.hostname === 'www.pawbridge.kr' && ['/favicon-96.png', '/apple-touch-icon.png'].includes(url.pathname)))) {
        publicAssetsMocked += 1;
        return route.fulfill({ status: 200, contentType: url.hostname === 'www.pawbridge.kr' ? 'image/png' : 'text/css', body: '' });
      }
      if (request.method() === 'GET' && url.hostname === 't1.daumcdn.net'
        && url.pathname === '/mapjsapi/bundle/postcode/prod/postcode.v2.js') {
        publicAssetsMocked += 1;
        return route.fulfill({ contentType: 'text/javascript', body: 'window.daum = { Postcode: class { open() {} } };' });
      }
      if (request.resourceType() === 'image' && url.hostname === 'lh3.googleusercontent.com') {
        publicAssetsMocked += 1;
        return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#f4f4f4"/></svg>' });
      }
      unexpected.push({ hostname: url.hostname, path: url.pathname, method: request.method() });
      return route.abort();
    }
    const path = url.pathname;
    if (path === '/api/v1/visits/identity' || (path === '/api/v1/visits/today' && request.method() === 'POST')) {
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/v1/visits/today') return route.fulfill({ json: { data: { date: today, count: 0 } } });
    if (path === '/api/v1/auth/login') return route.fulfill({
      status: validLogin ? 200 : 401,
      json: validLogin ? { code: 200, data: {
        userId: 901, name: '합성 사용자', email: 'member@example.invalid', role: 'ROLE_USER',
        accessToken: 'synthetic-test-token', refreshToken: 'synthetic-refresh',
      } } : { code: 401, data: null, message: '합성 로그인 실패' },
    });
    if (path.startsWith('/api/v1/dependency-probe/')) {
      probes.push({ path, method: request.method(), headers: request.headers(), body: request.postData() });
      if (path.endsWith('/network')) return route.abort();
      if (path.endsWith('/failure')) return route.fulfill({ status: 422, json: { message: '합성 검증 오류' } });
      return route.fulfill({ json: { accepted: true, values: [1, 2] } });
    }
    if (path.endsWith('ticket')) {
      return route.fulfill({ status: 503, json: { message: 'Synthetic stream disabled' } });
    }
    if (path === '/api/v1/comments/posts/read/41') return route.fulfill({ json: { code: 200, data: [] } });
    if (path === '/api/v1/posts/read/41') return route.fulfill({ json: { code: 200, data: {
      postId: 41, title: '합성 작성자 연락', content: '합성 내용', authorId: 902,
      authorName: '합성 작성자', boardType: 'COMMUNICATION', imageUrls: [],
      createdAt: '2026-10-12T01:00:00Z', likeCount: 0, viewCount: 1,
    } } });
    if (path === '/api/v1/notes/recipients/902') return route.fulfill({ json: { code: 200, data: { userId: 902, nickname: '합성 작성자', active: true } } });
    if (path === '/api/v1/chats/with/902') return route.fulfill({ json: { code: 200, data: { roomId: null } } });
    if (path === '/api/v1/notes/blocks/status') return route.fulfill({ json: { code: 200, data: { memberIds: [] } } });
    if (path.endsWith('/stats/today')) return route.fulfill({ json: { date: today, rescuedToday: 20, adoptedToday: 2 } });
    if (path.endsWith('/stats/status')) return route.fulfill({ json: [{ status: 'PROTECT', label: '보호중', count: 20 }] });
    if (path.endsWith('/stats/regional')) return route.fulfill({ json: [
      { region: '서울특별시', count: 8 }, { region: '경기도', count: 10 }, { region: '부산광역시', count: 2 },
    ] });
    if (!['GET', 'OPTIONS'].includes(request.method())) {
      unexpected.push({ hostname: url.hostname, path, method: request.method() });
      return route.abort();
    }
    return route.fulfill({ json: { code: 200, data: { content: [], nextCursor: null, unreadCount: 0, totalPages: 0 } } });
  };
  page.on('pageerror', recordError);
  await page.route('**/*', handler);
  try {
    for (const width of [1440, 375]) {
      validLogin = false;
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${origin}/login`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.goto(`${origin}/community/41`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: '합성 작성자에게 연락하기', exact: true }).click();
      await page.getByRole('link', { name: '1:1 대화', exact: true }).click();
      await page.waitForURL(`${origin}/login`);
      // Login v2 shows social login first; the email form opens behind this toggle.
      await page.getByRole('button', { name: /이메일로 로그인/ }).click();
      const email = page.getByPlaceholder('이메일 주소를 입력하세요');
      const password = page.getByPlaceholder('비밀번호를 입력하세요', { exact: true });
      await email.fill('member@example.invalid');
      await password.fill('synthetic-password');
      await page.getByRole('button', { name: '이메일로 로그인', exact: true }).click();
      await page.getByText('합성 로그인 실패', { exact: true }).first().waitFor();
      assert(await password.inputValue() === 'synthetic-password', 'Login failure lost input');
      assert(page.url() === `${origin}/login`, 'Login failure redirected');
      validLogin = true;
      await page.getByRole('button', { name: '이메일로 로그인', exact: true }).click();
      await page.waitForURL(`${origin}/chats/new?to=902&context=POST&contextId=41`);
      await page.getByLabel('메시지', { exact: true }).waitFor();
      checks.push(`login-error-and-contact-return-${width}`);

      const result = await page.evaluate(async () => {
        const { default: client } = await import('/src/api/client.ts');
        const read = await client.get('/api/v1/dependency-probe/json');
        const write = await client.post('/api/v1/dependency-probe/json', { text: '합성 JSON' });
        const form = new FormData();
        form.append('description', '합성 업로드');
        form.append('file', new Blob(['synthetic'], { type: 'text/plain' }), 'fixture.txt');
        await client.post('/api/v1/dependency-probe/multipart', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        let failure, network;
        try { await client.get('/api/v1/dependency-probe/failure'); }
        catch (error) { failure = { status: error.response?.status, message: error.response?.data?.message }; }
        try { await client.get('/api/v1/dependency-probe/network'); }
        catch (error) { network = error.code; }
        return { read: read.data, write: write.data, failure, network };
      });
      assert(result.read.accepted && result.read.values.join() === '1,2' && result.write.accepted, 'JSON response changed');
      assert(result.failure.status === 422 && result.failure.message === '합성 검증 오류', 'HTTP error contract changed');
      assert(result.network === 'ERR_NETWORK', 'Failed XHR resolved or changed error contract');
      const latest = probes.slice(-5);
      assert(latest.every(p => p.headers.authorization === 'Bearer synthetic-test-token' && p.headers['x-user-id'] === '901'), 'Auth headers changed');
      const json = latest.find(p => p.method === 'POST' && p.path.endsWith('/json'));
      assert(JSON.parse(json.body).text === '합성 JSON', 'JSON body changed');
      const multipart = latest.find(p => p.path.endsWith('/multipart'));
      assert(multipart.headers['content-type'].startsWith('multipart/form-data; boundary=')
        && multipart.body.includes('name="description"') && multipart.body.includes('filename="fixture.txt"'), 'Multipart boundary or fields changed');
      checks.push(`xhr-headers-json-multipart-errors-${width}`);

      await page.goto(`${origin}/animals/stats`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { name: '유기동물 현황', exact: true }).waitFor();
      await page.locator('.rsm-geography').first().waitFor();
      await page.getByRole('button', { name: /경기도.*10마리/ }).click();
      await page.getByRole('heading', { name: '경기도', exact: true }).waitFor();
      await page.getByRole('button', { name: '지도 크게 보기', exact: true }).click();
      await page.getByRole('dialog').waitFor();
      await page.getByRole('button', { name: '지도 확대', exact: true }).click();
      await page.getByText('150%', { exact: true }).waitFor();
      await page.keyboard.press('Escape');
      assert(await page.getByRole('dialog').count() === 0, 'Map dialog did not close');
      assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'Horizontal overflow');
      await page.screenshot({ path: `/tmp/pawbridge-security-map-${width}.png`, fullPage: true });
      checks.push(`map-render-selection-zoom-layout-${width}`);
    }
    assert(errors.length === 0, `Uncaught page errors: ${errors.join('; ')}`);
    assert(unexpected.length === 0, 'Unexpected external network traffic: ' + JSON.stringify(unexpected));
    return { checks, pageErrors: errors.length, unexpectedExternalRequests: unexpected.length, publicAssetsMocked, apiMocked: true, productionVerified: false };
  } finally {
    page.off('pageerror', recordError);
    await page.unroute('**/*', handler);
  }
}
