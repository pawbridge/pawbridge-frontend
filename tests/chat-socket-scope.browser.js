// Synthetic API/auth/socket only. 웹소켓은 채팅 화면에서만 열고, 다른 화면은 쪽지 알림 스트림의 chat 신호로 새 메시지를 안다.
async (page, origin = 'http://127.0.0.1:5186') => {
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) throw new Error('Loopback test origin required');
  const roomId = '12345678-1234-4567-89ab-123456789abc';
  const otherRoomId = '12345678-1234-4567-89ab-123456789abd';
  const room = (id, nickname, unread) => ({
    roomId: id, counterpartId: id === roomId ? 2 : 3, counterpartNickname: nickname, latestSequence: 2, readThrough: unread ? 1 : 2,
    counterpartReadThrough: 0, unread, canSend: true, updatedAt: '2026-10-11T01:00:00Z', preview: '합성 미리보기',
  });
  const rooms = [room(roomId, '합성 상대', true), room(otherRoomId, '다른 합성 상대', false)];
  const errors = [];
  const recordError = error => errors.push(error.message);
  const sockets = { opened: 0, closed: 0 };
  let tickets = 0;
  let streams = 0;
  let lists = 0;
  let arrived = false;
  // 스트림 연결을 차례로 붙잡아 두고, 시험이 풀어 줄 때 신호를 싣는다.
  const gates = [1, 2, 3].map(() => { let open; const wait = new Promise(resolve => { open = resolve; }); return { wait, open }; });
  const event = (name, data) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
  const message = (id, sequence) => event('chat', { memberId: 1, kind: 'MESSAGE', roomId: id, sequence });
  const streamBodies = [
    event('ready', {}) + message(roomId, 2),
    // 같은 신호가 다시 온다. 웹소켓과 스트림이 함께 전하거나 서버가 다시 보낼 때와 같다.
    event('ready', {}) + message(roomId, 2),
    // 채팅 화면에서 웹소켓이 연결된 동안 스트림으로 온 신호.
    event('ready', {}) + message(otherRoomId, 3),
  ];
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const handler = async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/v1/')) return url.origin === origin ? route.continue() : route.abort();
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204 });
    if (url.pathname === '/api/v1/notes/stream') {
      const turn = streams++;
      // 준비한 신호를 다 보낸 뒤에는 다시 붙지 않게 오래 기다리게 한다.
      if (turn >= streamBodies.length) return route.fulfill({ status: 429, headers: { 'retry-after': '120' }, body: '' });
      await gates[turn].wait;
      if (turn === 0) arrived = true;
      try { return await route.fulfill({ status: 200, contentType: 'text/event-stream', body: streamBodies[turn] }); }
      catch (error) { if (!route.request().failure() && !/already handled|closed/.test(error.message)) throw error; }
      return;
    }
    if (url.pathname === '/api/v1/chats/connection-ticket') {
      tickets++;
      return route.fulfill({ json: { code: 200, data: { ticket: 'synthetic-ticket', expiresAt: Date.now() + 30000 } } });
    }
    let data = { content: [], nextCursor: null, unreadCount: 0, totalPages: 0, totalElements: 0 };
    if (url.pathname === '/api/v1/chats/notifications') {
      lists++;
      if (arrived) data = { content: [rooms[0]], nextCursor: null, unreadCount: 1 };
    }
    if (url.pathname === '/api/v1/chats') data = { content: rooms, nextCursor: null };
    for (const item of rooms) {
      if (url.pathname === `/api/v1/chats/${item.roomId}`) data = item;
      if (url.pathname === `/api/v1/chats/${item.roomId}/messages`) data = {
        content: [{ roomId: item.roomId, sequence: 2, senderId: item.counterpartId, body: `${item.counterpartNickname}의 기록`, contextHref: null, createdAt: '2026-10-11T01:00:00Z' }],
        nextCursor: null, counterpartReadThrough: 0,
      };
    }
    return route.fulfill({ json: { code: 200, data } });
  };
  // 채팅 알림 목록 요청이 한동안 더 생기지 않을 때까지 기다린다.
  const settle = async () => {
    for (let seen = -1, quiet = 0; quiet < 6; quiet = seen === lists ? quiet + 1 : 0) {
      seen = lists;
      await page.waitForTimeout(100);
    }
  };
  const streamServed = turn => page.waitForResponse(response => new URL(response.url()).pathname === '/api/v1/notes/stream' && streams === turn + 1);
  await page.addInitScript(() => localStorage.setItem('auth-storage', JSON.stringify({
    state: { user: { id: 1, name: '합성 사용자', role: 'ROLE_USER' }, accessToken: 'synthetic-test-token', refreshToken: null }, version: 0,
  })));
  await page.route('**/*', handler);
  // 합성 STOMP 서버. 연결 요청에만 답하고 신호는 보내지 않는다.
  await page.routeWebSocket(/\/api\/v1\/chats\/socket$/, socket => {
    sockets.opened++;
    socket.onMessage(frame => {
      if (String(frame).startsWith('CONNECT')) socket.send('CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0');
    });
    socket.onClose(() => { sockets.closed++; });
  });
  page.on('pageerror', recordError);
  try {
    await page.goto(`${origin}/notes`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: '쪽지', exact: true }).waitFor();
    const bell = page.getByRole('button', { name: /^알림,/ });
    await page.getByRole('button', { name: /^알림,.*새 메시지가 있는 대화 0개/ }).waitFor();
    await settle();
    // 새 메시지 알림은 종 숫자와 알림 목록에만 나온다. 화면을 덮는 알림 상자는 없다.
    const arrivedBox = page.getByText(/님에게 새 메시지가 왔어요/);
    check(tickets === 0 && sockets.opened === 0, `A page other than chat opened the chat socket before any signal (tickets ${tickets}, sockets ${sockets.opened})`);

    gates[0].open();
    await page.getByRole('button', { name: /^알림,.*새 메시지가 있는 대화 1개/ }).waitFor();
    check(tickets === 0 && sockets.opened === 0, `A page other than chat opened the chat socket (tickets ${tickets}, sockets ${sockets.opened})`);
    await settle();
    check(await arrivedBox.count() === 0, 'A notification box appeared for the stream signal');
    const beforeRepeat = lists;
    const repeated = streamServed(1);
    gates[1].open();
    await (await repeated).finished();
    // 되풀이된 신호도 목록은 다시 맞춘다.
    const deadline = Date.now() + 5000;
    while (lists === beforeRepeat && Date.now() < deadline) await page.waitForTimeout(50);
    check(lists > beforeRepeat, 'The repeated signal did not refresh the chat notification list');
    await settle();
    check(await arrivedBox.count() === 0, 'A notification box appeared for the repeated signal');
    check(tickets === 0 && sockets.opened === 0, `Stream signals opened the chat socket (tickets ${tickets}, sockets ${sockets.opened})`);

    await bell.click();
    await page.getByRole('region', { name: '알림 목록' }).getByRole('link', { name: /^합성 상대님에게 새 메시지가 왔어요/ }).click();
    await page.waitForURL(`${origin}/chats/${roomId}`);
    await page.getByText('합성 상대의 기록', { exact: true }).waitFor();
    await page.getByText(/연결됨$/).waitFor();
    check(tickets === 1 && sockets.opened === 1, `Chat page should open one socket (tickets ${tickets}, sockets ${sockets.opened})`);

    // 웹소켓이 연결된 동안 스트림으로 온 신호는 건너뛴다. 같은 신호가 웹소켓으로 온다.
    await settle();
    const beforeSkipped = lists;
    const skipped = streamServed(2);
    gates[2].open();
    await (await skipped).finished();
    await page.waitForTimeout(700);
    check(lists === beforeSkipped, `A stream signal was handled while the socket was connected (${lists - beforeSkipped} extra list requests)`);

    await page.getByRole('link', { name: /^다른 합성 상대/ }).click();
    await page.waitForURL(`${origin}/chats/${otherRoomId}`);
    await page.getByText('다른 합성 상대의 기록', { exact: true }).waitFor();
    await page.getByText(/연결됨$/).waitFor();
    check(tickets === 1 && sockets.opened === 1 && sockets.closed === 0,
      `Changing rooms must keep the socket (tickets ${tickets}, opened ${sockets.opened}, closed ${sockets.closed})`);

    await page.getByRole('link', { name: '쪽지', exact: true }).click();
    await page.waitForURL(`${origin}/notes`);
    const closeDeadline = Date.now() + 5000;
    while (sockets.closed === 0 && Date.now() < closeDeadline) await page.waitForTimeout(50);
    check(sockets.closed === 1, 'Leaving the chat page must close the socket');
    await page.waitForTimeout(500);
    check(tickets === 1 && sockets.opened === 1, `Leaving must not reconnect (tickets ${tickets}, sockets ${sockets.opened})`);
    if (errors.length) throw new Error(`Uncaught page errors: ${errors.join('; ')}`);
    return {
      checks: ['other-page-no-ticket-no-socket', 'stream-signal-sets-count-without-box', 'repeated-signal-refreshes-list',
        'chat-page-opens-one-socket', 'stream-signal-skipped-while-socket-connected', 'room-change-keeps-socket', 'leaving-closes-socket'],
      mocked: ['auth', 'all-api-responses', 'note-stream', 'chat-socket'], productionVerified: false,
    };
  } finally {
    gates.forEach(gate => gate.open());
    page.off('pageerror', recordError);
    await page.unroute('**/*', handler);
  }
}
