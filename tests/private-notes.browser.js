// Real local dev APIs only; synthetic accounts are supplied in memory by the runner.
// Does not mock authentication, message persistence or SSE. Never use production credentials.
async (page, accounts) => {
  const origin = 'http://127.0.0.1:5184';
  const api = 'http://localhost:28080';
  const checks = [];
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const secondContext = await page.context().browser().newContext({ viewport: { width: 1440, height: 1000 } });
  const receiver = await secondContext.newPage();
  const headers = account => ({ Authorization: `Bearer ${account.token}` });
  const body = '합성 쪽지 검증 🐶\n<script>실행되면 안 됩니다</script>';
  const notification = async () => (await (await page.request.get(`${api}/api/notes/notifications`, { headers: headers(accounts[1]) })).json()).data;
  const waitFor = async condition => {
    for (let i = 0; i < 50; i++) { if (await condition()) return; await page.waitForTimeout(100); }
    throw new Error('Local dev condition timed out');
  };
  const login = async (target, account) => {
    await target.goto(`${origin}/login`);
    await target.getByPlaceholder('이메일 주소를 입력하세요').fill(account.email);
    await target.getByPlaceholder('비밀번호를 입력하세요').fill(account.password);
    // Separate login timestamps until the independently documented refresh-token collision is fixed.
    await target.waitForTimeout(1100);
    await target.getByRole('button', { name: '로그인', exact: true }).click();
    await target.waitForURL(`${origin}/`);
    await target.goto(`${origin}/notes`);
    await target.getByRole('heading', { name: '연락 공간' }).waitFor();
  };
  try {
    assert(accounts.slice(0, 3).every(account => account.email.startsWith('note-') && account.email.endsWith('@example.invalid')), 'Synthetic account guard missing');
    await waitFor(async () => {
      const response = await page.request.get(`${api}/api/notes`, { headers: headers(accounts[0]) });
      if ([502, 503, 504].includes(response.status())) return false;
      assert(response.status() === 200, `Local dev readiness/authentication failed: HTTP ${response.status()}`);
      return true;
    });
    await page.request.delete(`${api}/api/notes/blocks/${accounts[0].userId}`, { headers: headers(accounts[1]) });
    await page.request.delete(`${api}/api/notes/blocks/${accounts[1].userId}`, { headers: headers(accounts[0]) });
    // Remove only notes owned by these three task-created synthetic accounts from a previous failed run.
    for (const account of accounts.slice(0, 2)) {
      for (const box of ['SENT', 'INBOX']) {
        const list = await (await page.request.get(`${api}/api/notes?box=${box}`, { headers: headers(account) })).json();
        for (const note of list.data.content) await page.request.delete(`${api}/api/notes/${note.noteId}`, { headers: headers(account) });
      }
    }
    await login(page, accounts[0]); await login(receiver, accounts[1]);
    await waitFor(async () => (await notification()).unreadCount === 0);
    await page.goto(`${origin}/community`);
    await page.getByRole('button', { name: /에게 연락하기$/ }).first().click();
    const authorLink = page.getByRole('link', { name: '쪽지 보내기', exact: true });
    const authorBounds = await authorLink.boundingBox();
    assert(authorBounds && authorBounds.width > 0 && authorBounds.x >= 0, 'Author contact menu clipped');
    assert((await authorLink.getAttribute('href')).includes('context=POST'), 'Author context missing');
    checks.push('community-author-contact-entry');
    let loseResponse = true;
    const keys = [];
    await page.route(`${api}/api/notes`, async route => {
      if (route.request().method() !== 'POST') return route.continue();
      keys.push(route.request().postDataJSON().requestId);
      if (loseResponse) {
        loseResponse = false;
        const response = await route.fetch(); assert(response.ok(), 'First real persistence failed');
        return route.abort('failed'); // The DB committed, but the browser did not receive the response.
      }
      return route.continue();
    });
    await page.goto(`${origin}/notes/new?to=${accounts[1].userId}`);
    await page.getByLabel('쪽지 내용', { exact: true }).fill(body);
    await page.screenshot({ path: '/tmp/pawbridge-private-notes-compose.png', fullPage: true });
    await page.evaluate(() => { const button = [...document.querySelectorAll('button')].find(b => b.textContent === '쪽지 보내기'); button.click(); button.click(); });
    await page.getByRole('alert').filter({ hasText: '전송 결과를 확인하지 못했습니다' }).waitFor();
    assert(keys.length === 1, 'Double click emitted two POST requests'); checks.push('synchronous-double-click-guard');
    assert(await page.getByLabel('쪽지 내용', { exact: true }).getAttribute('readonly') !== null, 'Uncertain send draft was editable');
    await receiver.getByRole('status').filter({ hasText: '새 쪽지가 왔어요' }).waitFor();
    checks.push('real-after-commit-sse-notification');
    await page.getByRole('button', { name: '같은 쪽지 전송 확인' }).click();
    await page.waitForURL(/\/notes\/[0-9a-f-]{36}$/);
    const id = page.url().split('/').pop();
    assert(keys.length === 2 && keys[0] === keys[1], 'Uncertain retry changed idempotency key');
    assert((await notification()).unreadCount === 1, 'Retry created another received note'); checks.push('lost-response-idempotent-retry');
    await receiver.getByRole('button', { name: /^쪽지 알림/ }).click();
    const menu = receiver.getByRole('region', { name: '쪽지 알림 목록' });
    assert(!(await menu.innerText()).includes('합성 쪽지 검증'), 'Notification exposed a private body preview');
    assert((await notification()).unreadCount === 1, 'Opening notification menu marked note read'); checks.push('notification-without-body-and-no-menu-read');
    await menu.locator(`a[href="/notes/${id}"]`).click();
    await receiver.getByText(body, { exact: true }).waitFor();
    await waitFor(async () => (await notification()).unreadCount === 0); checks.push('detail-read-and-safe-plaintext');
    await receiver.setViewportSize({ width: 375, height: 812 });
    assert(await receiver.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile detail horizontal overflow');
    await receiver.screenshot({ path: '/tmp/pawbridge-private-notes-detail-mobile.png', fullPage: true });
    await receiver.setViewportSize({ width: 1440, height: 1000 });
    await receiver.getByRole('link', { name: '답장하기', exact: true }).click();
    await receiver.getByLabel('쪽지 내용', { exact: true }).fill('합성 답장 검증');
    await receiver.getByRole('button', { name: '쪽지 보내기', exact: true }).click();
    await receiver.waitForURL(/\/notes\/[0-9a-f-]{36}$/);
    const replyId = receiver.url().split('/').pop();
    const reply = await (await page.request.get(`${api}/api/notes/${replyId}`, { headers: headers(accounts[0]) })).json();
    assert(reply.data.body === '합성 답장 검증' && reply.data.direction === 'INBOX', 'Reply recipient or text mismatched');
    checks.push('real-ui-reply');
    await receiver.goto(`${origin}/notes/${id}`);
    await receiver.getByText(body, { exact: true }).waitFor();
    await receiver.getByRole('button', { name: '즐겨찾기', exact: true }).click();
    await receiver.getByRole('button', { name: '즐겨찾기 해제', exact: true }).waitFor();
    const senderNote = await (await page.request.get(`${api}/api/notes/${id}`, { headers: headers(accounts[0]) })).json();
    assert(senderNote.data.favorite === false, 'Favorite leaked to other mailbox'); checks.push('independent-favorites');
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '내 쪽지함에서 삭제' }).click();
    await page.waitForURL(/\/notes(?:\?|$)/);
    const retained = await page.request.get(`${api}/api/notes/${id}`, { headers: headers(accounts[1]) });
    assert(retained.ok(), 'Sender deletion removed recipient original'); checks.push('independent-mailbox-deletion');
    const foreign = await page.request.get(`${api}/api/notes/${id}`, { headers: headers(accounts[2]) });
    assert(foreign.status() === 404, 'A third member could read a private note'); checks.push('foreign-member-not-found');
    receiver.once('dialog', dialog => dialog.accept());
    const blockResponse = receiver.waitForResponse(response => response.url() === `${api}/api/notes/blocks/${accounts[0].userId}` && response.request().method() === 'PUT');
    await receiver.getByRole('button', { name: '회원 차단' }).click();
    assert((await blockResponse).ok(), 'Real block API failed');
    await receiver.getByRole('status').filter({ hasText: '회원을 차단했습니다' }).waitFor();
    const blocked = await page.request.post(`${api}/api/notes`, { headers: headers(accounts[0]), data: { recipientId: accounts[1].userId, body: '차단 후 전송 검증', requestId: crypto.randomUUID() } });
    assert(blocked.status() === 403, `Block did not prevent delivery: HTTP ${blocked.status()}`); checks.push('bidirectional-block-enforcement');
    await receiver.goto(`${origin}/notes/blocks`);
    await receiver.getByRole('button', { name: '차단 해제' }).click();
    await receiver.getByText('차단한 회원이 없습니다.', { exact: true }).waitFor(); checks.push('block-management-unblock');
    await receiver.locator('header').getByRole('button', { name: '로그아웃' }).first().click();
    await receiver.waitForURL(`${origin}/`);
    const offline = await page.request.post(`${api}/api/notes`, { headers: headers(accounts[0]), data: { recipientId: accounts[1].userId, body: '로그아웃 동안 보낸 합성 쪽지', requestId: crypto.randomUUID() } });
    assert(offline.ok(), 'Offline note persistence failed');
    await login(receiver, accounts[1]);
    await waitFor(async () => (await receiver.getByRole('button', { name: /^쪽지 알림/ }).getAttribute('aria-label')).includes('1개'));
    checks.push('offline-receipt-rest-restoration');
    await receiver.screenshot({ path: '/tmp/pawbridge-private-notes-desktop.png', fullPage: true });
    await receiver.setViewportSize({ width: 375, height: 812 });
    assert(await receiver.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile horizontal overflow');
    await receiver.getByRole('button', { name: /^쪽지 알림/ }).click();
    const bounds = await receiver.getByRole('region', { name: '쪽지 알림 목록' }).boundingBox();
    assert(bounds.x >= 0 && bounds.x + bounds.width <= 375, 'Mobile notification menu clipped');
    await receiver.screenshot({ path: '/tmp/pawbridge-private-notes-mobile.png', fullPage: true });
    checks.push('desktop-mobile-and-notification-overflow');
    await receiver.getByRole('button', { name: /^쪽지 알림/ }).click();
    await receiver.locator('header').getByRole('button', { name: '로그아웃' }).first().click();
    await receiver.waitForURL(`${origin}/`);
    await login(receiver, accounts[2]);
    await receiver.getByRole('heading', { name: '아직 쪽지가 없어요', exact: true }).waitFor();
    assert(!(await receiver.getByRole('button', { name: /^쪽지 알림/ }).getAttribute('aria-label')).includes('1개'), 'Previous account unread count leaked');
    checks.push('account-switch-private-state-reset');
    return { environment: 'local-dev-real-http', checks, screenshots: ['/tmp/pawbridge-private-notes-desktop.png', '/tmp/pawbridge-private-notes-mobile.png'] };
  } catch (error) {
    await receiver.screenshot({ path: '/tmp/pawbridge-private-notes-failure.png', fullPage: true });
    throw error;
  } finally { await secondContext.close(); }
}
