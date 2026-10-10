// Real local Gateway/PostgreSQL/Redis/WebSocket paths, not mocks. Never run against production.
async (page, accounts, bulkOnly = false) => {
  const origin = 'http://127.0.0.1:5184';
  const api = 'http://localhost:28080';
  const checks = [];
  const assert = (ok, description) => { if (!ok) throw new Error(description); };
  const step = name => console.log('[chat-check] ' + name);
  const headers = member => ({ Authorization: `Bearer ${member.token}` });
  const get = async (path, member) => {
    const response = await page.request.get(api + path, { headers: headers(member) });
    assert(response.ok(), 'Authorized local REST failed');
    return (await response.json()).data;
  };
  const wait = async predicate => {
    for (let n = 0; n < 100; n++) { if (await predicate()) return; await page.waitForTimeout(100); }
    throw new Error('Local chat condition timed out');
  };
  const peer = async context => context.addInitScript(() => {
    const Native = window.WebSocket;
    window.WebSocket = class extends Native {
      constructor(url, protocols) {
        const target = new URL(String(url));
        if (target.pathname === '/api/chats/socket' && target.port === '28080') target.port = '28180';
        super(target.href, protocols);
      }
    };
  });
  const login = async (target, member) => {
    await target.goto(origin + '/login');
    await target.getByPlaceholder('이메일 주소를 입력하세요').fill(member.email);
    await target.getByPlaceholder('비밀번호를 입력하세요').fill(member.password);
    await target.waitForTimeout(1100);
    await target.getByRole('button', { name: '로그인', exact: true }).click();
    await target.waitForURL(origin + '/');
    await target.goto(origin + '/chats');
    await target.getByRole('heading', { name: '연락 공간' }).waitFor();
  };
  const raw = async (target, member, recipient, count) => target.evaluate(async ({token,recipient,count}) => {
    const {Client} = await import('/node_modules/@stomp/stompjs/esm6/index.js');
    let response;
    for (let attempt = 0; attempt < 4; attempt++) {
      response = await fetch('http://localhost:28080/api/chats/connection-ticket', {
        method:'POST', headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}',
      });
      if (response.status !== 429) break;
      await new Promise(resolve => setTimeout(resolve,1000));
    }
    if (!response.ok) throw new Error('Ticket request failed');
    const {data} = await response.json();
    const pending = new Map();
    let connected, failed;
    const ready = new Promise((resolve,reject) => {
      connected = resolve; failed = reject;
      setTimeout(() => reject(new Error('CONNECT timed out')),5000);
    });
    const client = new Client({
      brokerURL:'ws://localhost:28080/api/chats/socket', connectHeaders:{ticket:data.ticket},
      reconnectDelay:0, debug:()=>{}, heartbeatIncoming:15000, heartbeatOutgoing:15000,
      onWebSocketError:()=>failed(new Error('Transport failed')),
      onStompError:()=>failed(new Error('Send rejected')),
      onConnect:()=>{
        client.subscribe('/user/queue/chat', frame=>{
          const receipt = JSON.parse(frame.body);
          if (receipt.status && !receipt.requestId) {
            for (const task of pending.values()) task.reject(new Error('Send rejected'));
            pending.clear();
          }
          const task = pending.get(receipt.requestId);
          if (task) { pending.delete(receipt.requestId); receipt.status ? task.reject(new Error('Send rejected')) : task.resolve(receipt); }
        }); connected();
      },
    });
    client.activate();
    try {
      await ready;
      await new Promise(resolve => setTimeout(resolve,250));
      let receipt;
      for (let n = 0; n < count; n++) {
        if (n < 3 || n === count-1) console.log('[chat-check] raw-send ' + n);
        const requestId = crypto.randomUUID();
        receipt = await new Promise((resolve,reject) => {
          pending.set(requestId,{resolve,reject});
          setTimeout(() => reject(new Error('Application receipt timed out')),20000);
          client.publish({destination:'/app/chat/send',body:
            JSON.stringify({recipientId:recipient,requestId,body:'합성 탐색 메시지 '+n})});
        });
        if (n < 3 || n === count-1) console.log('[chat-check] raw-ack ' + n);
      }
      return receipt;
    } catch (failure) {
      console.log('[chat-check] raw-failure ' + failure.message);
      throw failure;
    } finally { await client.deactivate({force:true}); }
  }, {token:member.token,recipient,count});

  if (bulkOnly) {
    await page.goto(origin + '/login');
    if (bulkOnly === 'parallel') {
      await login(page,accounts[0]);
      await page.goto(origin + '/chats/new?to=' + accounts[1].userId);
      await page.getByText(/2,000자 · 연결됨/).waitFor();
    }
    await raw(page,accounts[0],accounts[1].userId,bulkOnly === 'batch' ? 55 : 1);
    return {environment:'isolated-local-dev',checks:['isolated-stomp-receipt'],productionVerified:false};
  }

  let receiverContext = await page.context().browser().newContext({ viewport:{width:1440,height:1000} });
  await peer(receiverContext);
  let receiver = await receiverContext.newPage();
  const peerSockets = [];
  let receiverSubscribed = false;
  receiver.on('websocket', socket => {
    peerSockets.push(socket.url());
    socket.on('framesent', frame => {
      if (String(frame.payload).startsWith('SUBSCRIBE\n')) receiverSubscribed = true;
    });
  });
  try {
    step('login-and-empty-rooms');
    await login(page,accounts[0]); await login(receiver,accounts[1]);
    assert((await get('/api/chats',accounts[0])).content.length === 0,'Room created before first message');
    await page.goto(origin + '/chats/new?to=' + accounts[1].userId);
    await page.getByText(/2,000자 · 연결됨/).waitFor();
    await wait(async () => receiverSubscribed);
    await page.waitForTimeout(250); // Allow the actual peer inbound channel to install the subscription.
    const body = '합성 채팅 검증 🐶\n<script>실행되면 안 됩니다</script>';
    await page.getByLabel('메시지',{exact:true}).fill(body);
    await page.getByRole('button',{name:'보내기',exact:true}).click();
    await page.waitForURL(/\/chats\/[0-9a-f-]{36}$/);
    const room = page.url().split('/').pop();
    step('redis-cross-app-receive');
    await receiver.getByRole('status').filter({hasText:'새 메시지가 왔어요'}).waitFor();
    assert(peerSockets.some(url => url.includes(':28180/api/chats/socket')),'Receiver did not use actual peer gateway');
    assert((await get('/api/chats/notifications',accounts[1])).unreadCount === 1,'Unread room missing');
    await receiver.getByRole('button',{name:/^연락 알림/}).click();
    const menu = receiver.getByRole('region',{name:'연락 알림 목록'});
    assert(!(await menu.innerText()).includes('합성 채팅 검증'),'Notification exposed body');
    assert((await get('/api/chats/notifications',accounts[1])).unreadCount === 1,'Notification opening marked read');
    checks.push('actual-two-app-redis-delivery-and-body-free-notification');
    step('visible-read-and-mobile');
    await receiver.bringToFront();
    await menu.locator('a[href="/chats/'+room+'"]').click();
    await receiver.getByText(body,{exact:true}).waitFor();
    await wait(async () => (await get('/api/chats/notifications',accounts[1])).unreadCount === 0);
    await page.getByText('읽음',{exact:true}).waitFor();
    await receiver.setViewportSize({width:375,height:812});
    assert(await receiver.evaluate(() => document.documentElement.scrollWidth <= innerWidth),'Mobile horizontal overflow');
    await receiver.screenshot({path:'/tmp/pawbridge-member-chat-mobile.png',fullPage:true});
    await receiver.setViewportSize({width:1440,height:1000});
    checks.push('visible-read-safe-text-and-mobile');
    step('fifty-message-cursor-history');
    await page.bringToFront();
    await raw(page,accounts[0],accounts[1].userId,55);
    await wait(async () => (await get('/api/chats/'+room,accounts[0])).latestSequence === 56);
    await page.reload();
    await page.getByRole('button',{name:'이전 메시지 50개 더 보기'}).click();
    await wait(async () => await page.locator('[data-sequence]').count() === 56);
    const order = await page.locator('[data-sequence]').evaluateAll(items => items.map(item => Number(item.dataset.sequence)));
    assert(order.every((sequence,n) => sequence === n+1),'History has duplicates or gaps');
    const content = await get('/api/chats/'+room+'/messages',accounts[0]);
    assert(content.content.every(message => message.senderId === accounts[0].userId),'Forged sender accepted');
    await page.screenshot({path:'/tmp/pawbridge-member-chat-desktop.png',fullPage:true});
    checks.push('actual-fifty-cursor-history-and-authenticated-sender');
    step('hide-and-new-message-restoration');
    receiver.once('dialog',dialog => dialog.accept());
    await receiver.getByRole('button',{name:'내 목록에서 숨기기'}).click();
    await receiver.waitForURL(origin+'/chats');
    assert((await get('/api/chats',accounts[1])).content.length === 0,'Personal hide failed');
    assert((await get('/api/chats',accounts[0])).content.length === 1,'Hide changed counterpart state');
    await page.bringToFront();
    await page.waitForTimeout(2200);
    await raw(page,accounts[0],accounts[1].userId,1);
    await wait(async () => (await get('/api/chats',accounts[1])).content.length === 1);
    checks.push('personal-hide-and-new-message-restoration');
    step('offline-login-recovery');
    await receiverContext.close();
    await page.waitForTimeout(2200);
    await raw(page,accounts[0],accounts[1].userId,1);
    receiverContext = await page.context().browser().newContext({viewport:{width:1440,height:1000}});
    await peer(receiverContext); receiver = await receiverContext.newPage();
    await login(receiver,accounts[1]);
    await wait(async () => (await get('/api/chats/notifications',accounts[1])).unreadCount === 1);
    assert(await receiver.getByRole('status').filter({hasText:'새 메시지가 왔어요'}).count() === 0,'Initial restore replayed old toast');
    checks.push('offline-login-rest-restoration-without-old-toast');
    step('foreign-room-authorization');
    for (const operation of ['get','put','delete']) {
      const path = operation === 'get' ? '/messages' : operation === 'put' ? '/read' : '/visibility';
      const response = await page.request[operation](api+'/api/chats/'+room+path,
        {headers:headers(accounts[2]),...(operation === 'put' ? {data:{sequence:1}} : {})});
      assert(response.status() === 404,'Foreign room operation accepted');
    }
    checks.push('foreign-room-read-write-hide-denied');
    step('block-prevents-new-chat');
    await receiver.goto(origin+'/chats/'+room);
    await receiver.getByLabel('메시지',{exact:true}).waitFor();
    receiver.once('dialog',dialog => dialog.accept());
    await receiver.getByRole('button',{name:'회원 차단'}).click();
    await wait(async () => (await get('/api/chats/'+room,accounts[0])).canSend === false);
    checks.push('shared-private-note-block-disables-chat');
    return {environment:'isolated-local-dev',checks,productionVerified:false};
  } catch (failure) {
    await page.screenshot({path:'/tmp/pawbridge-member-chat-failure.png',fullPage:true}).catch(() => {});
    await receiver.screenshot({path:'/tmp/pawbridge-member-chat-receiver-failure.png',fullPage:true}).catch(() => {});
    throw failure;
  } finally { await receiverContext.close(); }
}
