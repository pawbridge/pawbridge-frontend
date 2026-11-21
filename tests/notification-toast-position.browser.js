// Synthetic API/auth/socket only. 새 쪽지와 새 채팅 토스트는 화면 안에 놓이고, 눌러서 닫을 수 있어야 한다.
async (page, origin = 'http://127.0.0.1:5186') => {
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) throw new Error('Loopback test origin required');
  const roomId = '12345678-1234-4567-89ab-123456789abc';
  const noteId = '00000000-0000-4000-8000-000000000001';
  const room = {
    roomId, counterpartId: 2, counterpartNickname: '합성 상대', latestSequence: 2, readThrough: 1,
    counterpartReadThrough: 0, unread: true, canSend: true, updatedAt: '2026-10-11T01:00:00Z', preview: '합성 미리보기',
  };
  const note = {
    noteId, kind: 'PRIVATE_NOTE', actorId: 3, actorNickname: '합성 회원', createdAt: '2026-10-11T01:00:00Z',
    href: `/notes/${noteId}`, read: false,
  };
  const signal = { memberId: 1, kind: 'MESSAGE', roomId, sequence: 2 };
  const errors = [];
  const recordError = error => errors.push(error.message);
  const original = page.viewportSize();
  let streams = 0;
  let arrived = false;
  let release;
  const released = new Promise(resolve => { release = resolve; });
  // 채팅 신호는 웹소켓과 쪽지 알림 스트림 양쪽에 싣는다. 이 화면이 어느 쪽으로 받든 토스트는 하나다.
  let sendToSocket = () => {};
  const event = (name, data) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const handler = async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/v1/')) return url.origin === origin ? route.continue() : route.abort();
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204 });
    if (url.pathname === '/api/v1/notes/stream') {
      // 첫 연결만 신호를 싣고, 그 뒤에는 다시 붙지 않게 오래 기다리게 한다.
      if (streams++ > 0) return route.fulfill({ status: 429, headers: { 'retry-after': '120' }, body: '' });
      await released;
      arrived = true;
      sendToSocket();
      try {
        return await route.fulfill({
          status: 200, contentType: 'text/event-stream', body: event('ready', {}) + event('note', note) + event('chat', signal),
        });
      } catch (error) { if (!route.request().failure() && !/already handled|closed/.test(error.message)) throw error; }
      return;
    }
    if (url.pathname === '/api/v1/chats/connection-ticket') {
      return route.fulfill({ json: { code: 200, data: { ticket: 'synthetic-ticket', expiresAt: Date.now() + 30000 } } });
    }
    let data = { content: [], nextCursor: null, unreadCount: 0, totalPages: 0, totalElements: 0 };
    if (arrived && url.pathname === '/api/v1/chats/notifications') data = { content: [room], nextCursor: null, unreadCount: 1 };
    if (arrived && url.pathname === '/api/v1/notes/notifications') data = { content: [note], nextCursor: null, unreadCount: 1 };
    return route.fulfill({ json: { code: 200, data } });
  };
  const inside = (box, viewport) => box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height;
  const describe = box => `[${[box.x, box.y, box.x + box.width, box.y + box.height].map(Math.round).join(', ')}]`;
  await page.addInitScript(() => localStorage.setItem('auth-storage', JSON.stringify({
    state: { user: { id: 1, name: '합성 사용자', role: 'ROLE_USER' }, accessToken: 'synthetic-test-token', refreshToken: null }, version: 0,
  })));
  await page.route('**/*', handler);
  // 합성 STOMP 서버. 연결과 구독에 답하고, 구독이 있으면 그쪽으로도 신호를 보낸다.
  await page.routeWebSocket(/\/api\/v1\/chats\/socket$/, socket => {
    socket.onMessage(frame => {
      const text = String(frame);
      if (text.startsWith('CONNECT')) socket.send('CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0');
      const subscription = text.startsWith('SUBSCRIBE') && /\nid:([^\n]+)/.exec(text)?.[1];
      if (!subscription) return;
      const send = () => socket.send(
        `MESSAGE\ndestination:/user/queue/chat\nsubscription:${subscription}\nmessage-id:synthetic-1\ncontent-type:application/json\n\n${JSON.stringify(signal)}\0`,
      );
      if (arrived) send();
      else sendToSocket = send;
    });
  });
  page.on('pageerror', recordError);
  try {
    await page.goto(`${origin}/notes`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: '쪽지', exact: true }).waitFor();
    await page.getByRole('button', { name: /^알림,/ }).waitFor();
    const noteToast = page.getByRole('status').filter({ hasText: '합성 회원님에게 새 쪽지가 왔어요' });
    const chatToast = page.getByRole('status').filter({ hasText: '합성 상대님에게 새 메시지가 왔어요' });
    release();
    await noteToast.waitFor({ state: 'attached' });
    await chatToast.waitFor({ state: 'attached' });

    // PC 폭과 모바일 폭에서 두 토스트가 화면 안에 있고 서로 겹치지 않는다.
    for (const viewport of [original, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      const noteBox = await noteToast.boundingBox();
      const chatBox = await chatToast.boundingBox();
      check(noteBox && inside(noteBox, viewport), `The note toast is outside the ${viewport.width}x${viewport.height} viewport: ${noteBox && describe(noteBox)}`);
      check(chatBox && inside(chatBox, viewport), `The chat toast is outside the ${viewport.width}x${viewport.height} viewport: ${chatBox && describe(chatBox)}`);
      check(chatBox.y + chatBox.height <= noteBox.y, `The toasts overlap at ${viewport.width}px: chat ${describe(chatBox)}, note ${describe(noteBox)}`);
    }
    await page.setViewportSize(original);

    await noteToast.getByRole('button', { name: '새 쪽지 알림 닫기' }).click();
    await noteToast.waitFor({ state: 'detached' });
    await chatToast.getByRole('button', { name: '새 채팅 알림 닫기' }).click();
    await chatToast.waitFor({ state: 'detached' });
    if (errors.length) throw new Error(`Uncaught page errors: ${errors.join('; ')}`);
    return {
      checks: ['toasts-inside-desktop-viewport', 'toasts-inside-mobile-viewport', 'toasts-do-not-overlap', 'toasts-close-on-click'],
      mocked: ['auth', 'all-api-responses', 'note-stream', 'chat-socket'], productionVerified: false,
    };
  } finally {
    release();
    page.off('pageerror', recordError);
    await page.setViewportSize(original);
    await page.unroute('**/*', handler);
  }
}
