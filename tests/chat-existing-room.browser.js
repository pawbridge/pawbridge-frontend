// Real local REST, WebSocket and PostgreSQL. Hidden-room lookup itself must never write.
async (page, accounts, origin = 'http://127.0.0.1:5184') => {
  const api = 'http://localhost:28080';
  const headers = { Authorization: `Bearer ${accounts[0].token}` };
  const get = async path => {
    const response = await page.request.get(api + path, { headers });
    if (!response.ok()) throw new Error(`Local read failed: ${response.status()}`);
    return (await response.json()).data;
  };
  await page.goto(origin + '/login', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('이메일 주소를 입력하세요').fill(accounts[0].email);
  await page.getByPlaceholder('비밀번호를 입력하세요', { exact: true }).fill(accounts[0].password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await page.waitForURL(origin + '/', { waitUntil: 'domcontentloaded' });
  if ((await get(`/api/chats/with/${accounts[1].userId}`)).roomId !== null) throw new Error('Fresh pair fixture required');
  await page.goto(`${origin}/chats/new?to=${accounts[1].userId}`, { waitUntil: 'domcontentloaded' });
  await page.getByText(/2,000자 · 연결됨/).waitFor();
  if ((await get('/api/chats')).content.length) throw new Error('Lookup created a room');
  const body = '숨긴 대화 재연결 검증 🐈';
  await page.getByLabel('메시지', { exact: true }).fill(body);
  await page.getByRole('button', { name: '보내기', exact: true }).click();
  await page.waitForURL(/\/chats\/[0-9a-f-]{36}$/, { waitUntil: 'domcontentloaded' });
  const room = new URL(page.url()).pathname.split('/').pop();
  const hidden = await page.request.delete(`${api}/api/chats/${room}/visibility`, { headers });
  if (!hidden.ok()) throw new Error('Local hide failed');
  if ((await get('/api/chats')).content.length) throw new Error('Hidden room is still listed');
  const history = await get(`/api/chats/${room}/messages`);
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/chats/new?to=${accounts[1].userId}&context=REPORT&contextId=23`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(`${origin}/chats/${room}?context=REPORT&contextId=23`, { waitUntil: 'domcontentloaded' });
    await page.getByText(body, { exact: true }).waitFor();
    if (await page.getByLabel('메시지', { exact: true }).inputValue()) throw new Error('Draft unexpectedly filled');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Horizontal overflow');
    await page.screenshot({ path: `/tmp/contact-existing-room-${width}.png`, fullPage: true });
  }
  if ((await get('/api/chats')).content.length) throw new Error('Recontact unhid a room');
  const after = await get(`/api/chats/${room}/messages`);
  if (after.content.length !== history.content.length) throw new Error('Recontact sent a message');
  // Failure must be retryable, not silently interpreted as "no previous room".
  let fail = true;
  const lookupRoute = `**/api/chats/with/${accounts[1].userId}`;
  await page.route(lookupRoute, route => fail ? route.fulfill({ status: 503, json: { message: 'synthetic failure' } }) : route.continue());
  await page.goto(`${origin}/chats/new?to=${accounts[1].userId}`, { waitUntil: 'domcontentloaded' });
  await page.getByText('이전 대화를 확인하지 못했어요.', { exact: false }).waitFor();
  if (await page.getByLabel('메시지', { exact: true }).count()) throw new Error('Lookup failure exposed new-message form');
  fail = false;
  await page.getByRole('button', { name: '다시 시도', exact: true }).last().click();
  await page.waitForURL(`${origin}/chats/${room}`, { waitUntil: 'domcontentloaded' });
  await page.unroute(lookupRoute);
  return { environment: 'isolated-local-dev', checks: ['null-without-creation', 'actual-websocket-first-send', 'hidden-history-before-send', 'context-preserved', 'no-unhide-or-extra-message', 'desktop-mobile', 'lookup-failure-retry'], productionVerified: false };
}
