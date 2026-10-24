// playwright-cli run-code --filename=tests/auth-refresh.browser.js
// Vite localhost:5231, VITE_API_BASE_URL=http://localhost:28080. 모든 API 응답은 합성이며 실제 로그인·쿠키 발급은 검증하지 않는다.
async page => {
  // 쿠키 전송 여부를 보려고 화면과 API를 같은 사이트(localhost)에 둔다.
  const origin = 'http://localhost:5231';
  const api = 'http://localhost:28080';
  const checks = [];
  const errors = [];
  const unexpected = [];
  const requests = [];
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const encode = value => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const token = (userId, label, secondsLeft = 3600) => [
    encode({ alg: 'none' }),
    encode({ sub: `member${userId}@example.invalid`, userId, name: `member-${label}`, role: 'ROLE_USER', exp: Math.floor(Date.now() / 1000) + secondsLeft }),
    'synthetic',
  ].join('.');
  const firstToken = token(901, 'first');
  const refreshedToken = token(901, 'refreshed');
  const expiredToken = token(901, 'expired', -60);
  const profile = { id: 901, email: 'member901@example.invalid', name: 'member-first', role: 'ROLE_USER', createdAt: '2026-10-24T00:00:00' };

  // refresh: 'ok' | 'fail' (기존 백엔드처럼 본문 누락 400) | 'unauthorized'
  let refreshMode = 'ok';
  let refreshDelay = 0;
  let protectedAcceptsRefreshed = true;
  let loginIncludesRefreshToken = false;
  const corsHeaders = {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'authorization,content-type,x-user-id',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
  };
  const handler = async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const respond = (status, data) => route.fulfill({ status, headers: corsHeaders, json: { code: status, message: null, data } });
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders });
    const authorization = request.headers().authorization || '';
    const sentCookie = Boolean((await request.allHeaders()).cookie);
    if (path === '/api/v1/auth/login' && method === 'POST') {
      requests.push({ path, sentCookie });
      const data = { userId: 901, email: profile.email, name: profile.name, role: 'ROLE_USER', careRegNo: null, accessToken: firstToken };
      if (loginIncludesRefreshToken) data.refreshToken = 'legacy-body-refresh';
      return respond(200, data);
    }
    if (path === '/api/v1/auth/refresh' && method === 'POST') {
      requests.push({ path, sentCookie, contentType: request.headers()['content-type'], body: request.postData() });
      if (refreshDelay) await new Promise(resolve => setTimeout(resolve, refreshDelay));
      if (refreshMode === 'fail') return respond(400, null);
      if (refreshMode === 'unauthorized') return respond(401, null);
      return respond(200, { accessToken: refreshedToken });
    }
    if (path === '/api/v1/auth/logout' && method === 'POST') {
      requests.push({ path, sentCookie, contentType: request.headers()['content-type'], body: request.postData(), bearer: authorization.startsWith('Bearer ') });
      return respond(200, null);
    }
    if (path === '/api/test/protected' && method === 'GET') {
      requests.push({ path, bearer: authorization === `Bearer ${refreshedToken}` ? 'refreshed' : 'other' });
      if (protectedAcceptsRefreshed && authorization === `Bearer ${refreshedToken}`) return respond(200, { ok: true });
      return respond(401, null);
    }
    if (path === '/api/animals' && method === 'GET') {
      requests.push({ path });
      return respond(401, null);
    }
    // 화면이 함께 부르는 다른 공개 조회는 이 검사의 대상이 아니므로 일시 오류로 둔다.
    if (method === 'GET') return respond(503, null);
    unexpected.push(`${method} ${path}`);
    return route.abort();
  };
  const countRefresh = () => requests.filter(item => item.path === '/api/v1/auth/refresh').length;
  const storedState = () => page.evaluate(() => JSON.parse(localStorage.getItem('auth-storage') ?? 'null')?.state ?? null);
  const reset = async () => {
    requests.length = 0;
    refreshMode = 'ok';
    refreshDelay = 0;
    protectedAcceptsRefreshed = true;
    await page.goto(`${origin}/privacy`);
    await page.evaluate(() => localStorage.clear());
  };
  const seed = async accessToken => {
    await page.evaluate(([user, value]) => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user, accessToken: value, refreshToken: 'legacy-refresh' }, version: 0 }));
    }, [profile, accessToken]);
  };
  // Vite 개발 서버가 앱과 같은 모듈 인스턴스를 제공하므로 화면 없이 apiClient 동작을 확인한다.
  const callProtected = (times = 1) => page.evaluate(async count => {
    const { default: apiClient } = await import('/src/api/client.ts');
    const { getAuthSessionVersion } = await import('/src/store/authStore.ts');
    const before = getAuthSessionVersion();
    const results = await Promise.allSettled(Array.from({ length: count }, () => apiClient.get('/api/test/protected')));
    return {
      fulfilled: results.filter(result => result.status === 'fulfilled').length,
      versionKept: before === getAuthSessionVersion(),
    };
  }, times);

  // 두 번째 탭에도 같은 합성 응답을 쓰도록 브라우저 컨텍스트에 등록한다.
  await page.context().route(`${api}/api/**`, handler);
  // 브라우저가 credentials를 포함해 보낼 때만 전달되는 합성 쿠키다.
  await page.context().addCookies([{ name: 'pb_test_refresh', value: 'synthetic', domain: 'localhost', path: '/api/v1/auth', httpOnly: true, sameSite: 'Strict' }]);
  page.on('pageerror', error => errors.push(error.message));
  try {
    // 1. 기존 백엔드 소셜 로그인: 주소의 토큰을 쓰고 Refresh Token은 저장하지 않는다.
    await reset();
    await page.goto(`${origin}/oauth/callback?accessToken=${encodeURIComponent(firstToken)}&refreshToken=legacy-refresh`);
    await page.waitForURL(`${origin}/`, { timeout: 5000 });
    let state = await storedState();
    assert(state?.user?.id === 901 && state.accessToken === firstToken, 'Legacy callback did not sign in');
    assert(!('refreshToken' in state), 'Legacy callback stored refresh token');
    assert(countRefresh() === 0, 'Legacy callback called refresh');
    assert(!page.url().includes('accessToken'), 'Token stayed in URL');
    checks.push('legacy social callback signs in without storing refresh token');

    // 2. 새 백엔드 소셜 로그인: 쿼리 없이 돌아오면 쿠키로 재발급받는다.
    await reset();
    await page.goto(`${origin}/oauth/callback`);
    await page.waitForURL(`${origin}/`, { timeout: 5000 });
    state = await storedState();
    assert(state?.user?.id === 901 && state.accessToken === refreshedToken, 'Cookie callback did not sign in');
    const refreshRequest = requests.find(item => item.path === '/api/v1/auth/refresh');
    assert(refreshRequest?.contentType?.startsWith('application/json') && refreshRequest.body === '{}', 'Refresh request shape');
    assert(refreshRequest.sentCookie, 'Refresh request did not include credentials');
    checks.push('cookie social callback signs in through refresh');

    // 3. 새 백엔드 콜백인데 재발급 실패: 로그인 화면 오류로 돌아간다.
    await reset();
    refreshMode = 'unauthorized';
    await page.goto(`${origin}/oauth/callback`);
    await page.waitForURL(url => url.pathname === '/login', { timeout: 5000 });
    assert(new URL(page.url()).searchParams.get('error') === '로그인 정보를 받지 못했습니다', 'Callback failure message');
    checks.push('cookie social callback failure returns to login error');

    // 4. 인증 API 401: 동시 요청은 재발급 한 번을 공유하고 같은 세션으로 한 번씩 재시도한다.
    await reset();
    await seed(firstToken);
    await page.reload();
    refreshDelay = 200;
    const retried = await callProtected(3);
    assert(retried.fulfilled === 3, 'Retried requests did not succeed');
    assert(retried.versionKept, 'Same-member refresh changed session version');
    assert(countRefresh() === 1, `Expected one refresh, got ${countRefresh()}`);
    state = await storedState();
    assert(state.accessToken === refreshedToken && state.user.id === 901, 'Refreshed token not stored');
    assert(requests.filter(item => item.path === '/api/test/protected' && item.bearer === 'refreshed').length === 3, 'Retry did not use refreshed token');
    checks.push('401 refreshes once and retries with same session');

    // 5. 재시도도 401이면 다시 재발급하지 않고 로그인으로 보낸다.
    await reset();
    await seed(firstToken);
    await page.reload();
    protectedAcceptsRefreshed = false;
    // 로그인 이동으로 평가 컨텍스트가 사라질 수 있다.
    await callProtected(1).catch(() => undefined);
    await page.waitForURL(`${origin}/login`, { timeout: 5000 });
    assert(countRefresh() === 1, 'Retried 401 refreshed again');
    state = await storedState();
    assert(state?.user === null && state?.accessToken === null, 'Second 401 did not clear auth');
    checks.push('retry happens only once');

    // 6. 기존 백엔드처럼 재발급이 실패하면 기존 동작대로 로그인으로 보낸다.
    await reset();
    await seed(firstToken);
    await page.reload();
    refreshMode = 'fail';
    await callProtected(1).catch(() => undefined);
    await page.waitForURL(`${origin}/login`, { timeout: 5000 });
    state = await storedState();
    assert(state?.user === null && state?.accessToken === null, 'Refresh failure did not clear auth');
    checks.push('refresh failure keeps login redirect');

    // 7. 공개 API 401은 재발급·이동 없이 기존처럼 둔다.
    await reset();
    await seed(firstToken);
    await page.reload();
    await page.evaluate(async () => {
      const { default: apiClient } = await import('/src/api/client.ts');
      await apiClient.get('/api/animals').catch(() => undefined);
    });
    assert(countRefresh() === 0, 'Public API refreshed');
    assert(new URL(page.url()).pathname === '/privacy', 'Public API redirected');
    checks.push('public 401 unchanged');

    // 8. 앱 시작 시 만료 토큰은 조용히 재발급하고, 실패하면 이동 없이 로그인 상태만 지운다.
    await reset();
    await seed(expiredToken);
    await page.reload();
    await page.waitForFunction(value => JSON.parse(localStorage.getItem('auth-storage')).state.accessToken === value, refreshedToken, { timeout: 5000 });
    assert(countRefresh() === 1, 'Startup refresh count');
    checks.push('startup refreshes expired token');

    await reset();
    await seed(expiredToken);
    refreshMode = 'fail';
    await page.reload();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('auth-storage')).state.accessToken === null, null, { timeout: 5000 });
    assert(new URL(page.url()).pathname === '/privacy', 'Startup failure redirected');
    checks.push('startup failure clears auth without redirect');

    // 9. 두 탭이 동시에 401을 받으면 Web Lock 뒤의 탭은 저장된 새 토큰을 재사용한다.
    await reset();
    await seed(firstToken);
    await page.reload();
    const secondTab = await page.context().newPage();
    await secondTab.goto(`${origin}/privacy`);
    refreshDelay = 300;
    const tabCall = target => target.evaluate(async () => {
      const { default: apiClient } = await import('/src/api/client.ts');
      const response = await apiClient.get('/api/test/protected');
      return response.status;
    });
    const statuses = await Promise.all([tabCall(page), tabCall(secondTab)]);
    await secondTab.close();
    assert(statuses.every(status => status === 200), 'Cross-tab retries failed');
    assert(countRefresh() === 1, `Cross-tab refresh count ${countRefresh()}`);
    checks.push('cross-tab refresh uses one server call');

    // 10. 로그아웃은 v1 경로에 JSON 본문과 Bearer 토큰을 보낸다.
    await reset();
    await seed(firstToken);
    await page.reload();
    await page.evaluate(async () => {
      const { logout } = await import('/src/api/auth.api.ts');
      await logout();
    });
    const logoutRequest = requests.find(item => item.path === '/api/v1/auth/logout');
    assert(logoutRequest?.contentType?.startsWith('application/json') && logoutRequest.body === '{}' && logoutRequest.bearer, 'Logout request shape');
    assert(logoutRequest.sentCookie, 'Logout request did not include credentials');
    checks.push('logout uses v1 JSON request with bearer and credentials');

    // 11. 이메일 로그인은 응답에 Refresh Token이 있든 없든 Access Token만 저장한다.
    for (const includesRefreshToken of [false, true]) {
      await reset();
      loginIncludesRefreshToken = includesRefreshToken;
      await page.goto(`${origin}/login`);
      await page.getByRole('button', { name: /이메일로 로그인/ }).click();
      await page.getByPlaceholder('이메일 주소를 입력하세요').fill(profile.email);
      await page.getByPlaceholder('비밀번호를 입력하세요', { exact: true }).fill('synthetic-password');
      await page.getByRole('button', { name: '이메일로 로그인', exact: true }).click();
      await page.waitForURL(url => url.pathname !== '/login', { timeout: 5000 });
      state = await storedState();
      assert(state?.user?.id === 901 && state.accessToken === firstToken, `Local login failed (body refresh: ${includesRefreshToken})`);
      assert(!('refreshToken' in state), 'Local login stored refresh token');
      assert(requests.find(item => item.path === '/api/v1/auth/login')?.sentCookie, 'Login request did not include credentials');
      checks.push(`local login stores access token only (body refresh: ${includesRefreshToken})`);
    }

    assert(unexpected.length === 0, `Unexpected API traffic: ${unexpected.join(', ')}`);
    assert(errors.length === 0, `Page errors: ${errors.join(', ')}`);
    return { checks };
  } finally {
    await page.context().unroute(`${api}/api/**`, handler);
  }
}
