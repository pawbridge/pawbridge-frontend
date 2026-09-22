// Run via playwright-cli run-code --filename=tests/mypage-info-feedback.browser.js.
// Start Vite preview on 127.0.0.1:5201. All API traffic is mocked.
async page => {
  const origin = 'http://127.0.0.1:5201';
  const checks = [];
  const errors = [];
  const unexpected = [];
  const profile = {
    id: 901,
    userId: 901,
    email: 'feedback@example.invalid',
    name: '상태점검',
    nickname: '상태점검',
    provider: 'LOCAL',
    role: 'ROLE_USER',
    createdAt: '2026-09-21T00:00:00',
  };
  let mode = 'slow-error';
  let requests = 0;
  const assert = (condition, message) => { if (!condition) throw new Error(message); };

  await page.addInitScript(user => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user, accessToken: 'feedback-token-only' }, version: 0 }));
  }, profile);
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = request.url().replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    if (path !== '/api/users/me' || request.method() !== 'GET') {
      unexpected.push(`${request.method()} ${path}`);
      return route.abort();
    }
    requests += 1;
    const requestMode = mode;
    if (requestMode.startsWith('slow-')) await page.waitForTimeout(700);
    if (requestMode.endsWith('error')) {
      return route.fulfill({ status: 500, json: { code: 500, data: null, message: '상태 점검용 오류' } });
    }
    return route.fulfill({ json: { code: 200, data: profile, message: '성공' } });
  });

  try {
    for (const width of [1920, 390]) {
      requests = 0;
      mode = 'slow-error';
      await page.setViewportSize({ width, height: width === 1920 ? 1080 : 844 });
      await page.goto(`${origin}/mypage`);
      await page.getByTestId('mypage-info-loading').waitFor();
      await page.getByText('마이페이지 정보를 불러오는 중입니다.').waitFor();
      assert(await page.locator('header').count() === 1, 'Loading state lost the header');
      assert(await page.locator('footer').count() === 1, 'Loading state lost the footer');
      assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `Loading state overflow at ${width}`);
      await page.screenshot({ path: `/tmp/mypage-info-loading-${width}.png`, fullPage: true, animations: 'disabled' });

      await page.getByRole('heading', { name: '마이페이지를 불러오지 못했어요' }).waitFor();
      const retry = page.getByRole('button', { name: '다시 시도' });
      assert(await retry.count() === 1, 'Error state has no recovery action');
      assert(await page.locator('header').count() === 1, 'Error state lost the header');
      assert(await page.locator('footer').count() === 1, 'Error state lost the footer');
      assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `Error state overflow at ${width}`);
      await page.screenshot({ path: `/tmp/mypage-info-error-${width}.png`, fullPage: true, animations: 'disabled' });

      mode = 'slow-success';
      await retry.click();
      const retrying = page.getByRole('button', { name: '다시 불러오는 중...' });
      await retrying.waitFor();
      assert(await retrying.isDisabled(), 'Retry button must be disabled while retrying');
      await page.getByRole('heading', { name: '프로필 정보', exact: true }).waitFor();
      assert(await page.locator('main input[readonly]').first().inputValue() === profile.email, 'Retry did not render profile data');
      checks.push(`loading/error/retry/layout ${width}`);
    }

    assert(requests >= 3, 'Expected the initial attempt, automatic retry, and manual retry');
    assert(errors.length === 0, `Page errors: ${errors.join(', ')}`);
    assert(unexpected.length === 0, `Unexpected API traffic: ${unexpected.join(', ')}`);
    return { checks, requests, pageErrors: errors, unexpectedRequests: unexpected };
  } finally {
    await page.unroute('**/api/**');
  }
}
