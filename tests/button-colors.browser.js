// 모의 데이터로 공통 Button의 비활성 모양과 위험 모양을 라이트, 다크에서 실제로 그려 색을 읽는다.
// 다크 바탕 클래스가 disabled보다 뒤에 생성되므로, dark:disabled가 빠지면 비활성 버튼이 다크 바탕색으로 보인다.
async page => {
  const origin = 'http://127.0.0.1:5278';
  const checks = [], pageErrors = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); checks.push(name); };
  const user = { id: 10, userId: 10, name: '검수회원', nickname: '검수회원', email: 'button@example.invalid', provider: 'LOCAL', role: 'ROLE_ADMIN', createdAt: '2026-09-01T00:00:00' };
  const soldOut = { wishlistId: 1, skuId: 101, skuCode: 'SKU-1', productId: 201, productName: '품절 검수 상품', productImageUrl: '', productStatus: 'SOLD_OUT', price: 1000, options: {}, createdAt: '2026-09-01T00:00:00' };
  const post = { id: 1, title: '검수 입양후기', content: '검수 본문', boardType: 'ADOPTION', authorId: 10, authorName: '검수회원', imageUrls: [], createdAt: '2026-10-30T01:00:00Z' };
  let releaseDelete = null;
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  await page.route('**/*', async route => {
    const request = route.request();
    const parts = /^https?:\/\/([^/:]+)(?::\d+)?(\/[^?]*)?/.exec(request.url());
    if (!parts) return route.abort('blockedbyclient');
    const hostname = parts[1], path = parts[2] || '/';
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return route.fallback();
    if (!path.startsWith('/api/v1/') || !['xhr', 'fetch'].includes(request.resourceType())) return route.continue();
    if (path === '/api/v1/notes/stream') return route.fulfill({ status: 429, headers: { 'retry-after': '300' }, body: '' });
    if (path === '/api/v1/notes/notifications') return route.fulfill({ json: { code: 200, data: { content: [], nextCursor: null, unreadCount: 0 } } });
    if (path === '/api/v1/users/me/favorite-animal-notifications') return route.fulfill({ json: { code: 200, data: { content: [] } } });
    if (path === '/api/v1/users/me') return route.fulfill({ json: { code: 200, data: user } });
    if (path === '/api/v1/users/me/wishlists') return route.fulfill({ json: { code: 200, data: { content: [soldOut], page: 0, number: 0, size: 20, totalElements: 1, totalPages: 1 } } });
    if (path === '/api/v1/posts/read/1') return route.fulfill({ json: { code: 200, message: 'OK', data: post } });
    // 삭제 요청은 붙잡아 두어 그동안 삭제 버튼이 비활성으로 남게 한다.
    if (path === '/api/v1/posts/1' && request.method() === 'DELETE') {
      await new Promise(resolve => { releaseDelete = resolve; });
      return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
    }
    if (path === '/api/v1/comments/posts/read/1') return route.fulfill({ json: { code: 200, message: 'OK', data: [] } });
    return route.fulfill({ status: 503, json: { message: '모의 응답 없음' } });
  });
  const setDark = dark => page.evaluate(on => document.documentElement.classList.toggle('dark', on), dark);
  // transition-colors가 있어 모드를 바꾼 직후에는 중간 색이 읽히므로 기대한 색이 될 때까지 잠시 기다린다.
  const colorsOf = async (locator, expected) => {
    const read = () => locator.evaluate(element => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, text: style.color, border: style.borderTopColor };
    });
    for (let i = 0; i < 20; i++) {
      const colors = await read();
      if (colors.background === expected.background && colors.text === expected.text) return colors;
      await page.waitForTimeout(50);
    }
    return read();
  };
  const check = async (locator, name, expected) => {
    for (const dark of [false, true]) {
      await setDark(dark);
      const want = dark ? expected.dark : expected.light;
      const colors = await colorsOf(locator, want);
      const mode = dark ? 'dark' : 'light';
      assert(colors.background === want.background, `${name}-${mode}-background: ${colors.background}`);
      assert(colors.text === want.text, `${name}-${mode}-text: ${colors.text}`);
      if (want.border) assert(colors.border === want.border, `${name}-${mode}-border: ${colors.border}`);
    }
    await setDark(false);
  };

  // 비활성은 모양과 관계없이 --brand-disabled 바탕, --brand-disabled-ink 글자, 투명 테두리다.
  const disabledColors = {
    light: { background: 'rgb(217, 217, 217)', text: 'rgb(126, 138, 143)', border: 'rgba(0, 0, 0, 0)' },
    dark: { background: 'rgb(38, 38, 38)', text: 'rgb(120, 113, 108)', border: 'rgba(0, 0, 0, 0)' },
  };

  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto(origin + '/terms');
  await page.evaluate(user => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user, accessToken: 'test-only-token' }, version: 0 }));
    sessionStorage.setItem('mypageActiveTab', 'wishlist');
  }, user);

  // 비활성: 관심 상품의 품절 담기 버튼. 상점 탭은 지금 관리자에게만 보여서 관리자로 연다. 색은 --brand-disabled, --brand-disabled-ink 토큰 값이다.
  await page.goto(origin + '/mypage');
  const disabled = page.getByRole('button', { name: '품절', exact: true });
  await disabled.waitFor();
  assert(await disabled.isDisabled(), 'sold-out-button-disabled');
  await check(disabled, 'disabled-primary', disabledColors);

  // 위험: 작성자가 보는 입양후기 삭제 버튼. 라이트는 red-50 바탕에 red-700 글자, 다크는 red-950 바탕에 red-300 글자다.
  await page.goto(origin + '/adoption/1');
  const danger = page.getByRole('button', { name: '삭제', exact: true });
  await danger.waitFor();
  await check(danger, 'danger', {
    light: { background: 'rgb(254, 242, 242)', text: 'rgb(185, 28, 28)' },
    dark: { background: 'rgb(69, 10, 10)', text: 'rgb(252, 165, 165)' },
  });

  // 비활성 위험: 삭제 요청 중인 삭제 버튼. 다크 바탕(dark:bg-red-950)보다 비활성 색이 이겨야 한다.
  await danger.click();
  await page.waitForFunction(() => document.querySelector('main button:disabled')?.textContent?.trim() === '삭제');
  await check(danger, 'disabled-danger', disabledColors);
  releaseDelete?.();

  assert(pageErrors.length === 0, 'no-page-errors: ' + pageErrors.join(' | '));
  return checks;
}
