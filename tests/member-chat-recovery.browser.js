// Real local apps and DB. Only the ACK delivery and task-owned local containers are interrupted.
async (page, accounts, faults) => {
  const origin = 'http://127.0.0.1:5184';
  const api = 'http://localhost:28080';
  const checks = [];
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const step = name => console.log('[chat-check] ' + name);
  const wait = async predicate => {
    for (let n=0;n<300;n++) { if (await predicate()) return; await page.waitForTimeout(100); }
    throw new Error('Local recovery condition timed out');
  };
  const instrument = async (context, peer) => context.addInitScript(({peer}) => {
    const Native = window.WebSocket;
    window.__chatRequests = []; window.__chatSockets = []; window.__dropChatReceipt = false;
    window.WebSocket = class extends Native {
      constructor(url, protocols) {
        const target = new URL(String(url));
        if (peer && target.pathname === '/api/chats/socket') target.port = '28180';
        super(target.href,protocols);
        if (target.pathname === '/api/chats/socket') window.__chatSockets.push(this);
      }
      send(data) {
        if (typeof data === 'string' && data.startsWith('SEND\n')) {
          try { window.__chatRequests.push(JSON.parse(data.slice(data.indexOf('\n\n')+2).replace(/\0$/, '')).requestId); } catch { /* Not a JSON send. */ }
        }
        super.send(data);
      }
      set onmessage(handler) {
        super.onmessage = event => {
          const text = event.data instanceof ArrayBuffer ? new TextDecoder().decode(event.data) : String(event.data);
          if (window.__dropChatReceipt && text.trimStart().startsWith('MESSAGE\n')) {
            try {
              const value = JSON.parse(text.slice(text.indexOf('\n\n')+2).replace(/\0\n?$/, ''));
              if (value.requestId && value.roomId && !value.status) {
                window.__dropChatReceipt = false; return; // The real DB has committed. Do not fabricate a response.
              }
            } catch { /* Pass unrecognized data through untouched. */ }
          }
          if (handler) handler.call(this,event);
        };
      }
    };
  }, {peer});
  const login = async (target, member) => {
    await target.goto(origin+'/login');
    await target.getByPlaceholder('이메일 주소를 입력하세요').fill(member.email);
    await target.getByPlaceholder('비밀번호를 입력하세요').fill(member.password);
    await target.waitForTimeout(1100);
    await target.getByRole('button',{name:'로그인',exact:true}).click();
    await target.waitForURL(origin+'/');
    await target.goto(origin+'/chats');
    await target.getByRole('heading',{name:'연락 공간'}).waitFor();
  };
  const get = async (path, member=accounts[0]) => {
    const response = await page.request.get(api+path,{headers:{Authorization:'Bearer '+member.token}});
    assert(response.ok(),'Authorized local recovery REST failed'); return (await response.json()).data;
  };
  const send = async body => {
    await page.getByText(/2,000자 · 연결됨/).waitFor({timeout:30000});
    await page.getByLabel('메시지',{exact:true}).fill(body);
    await page.getByRole('button',{name:'보내기',exact:true}).click();
    await wait(async () => await page.getByLabel('메시지',{exact:true}).inputValue() === '');
  };
  await instrument(page.context(),false);
  const context = await page.context().browser().newContext({viewport:{width:1440,height:1000}});
  await instrument(context,true);
  const receiver = await context.newPage();
  try {
    await login(page,accounts[0]); await login(receiver,accounts[1]);
    await page.goto(origin+'/chats/new?to='+accounts[1].userId);
    await page.getByText(/2,000자 · 연결됨/).waitFor({timeout:30000});
    step('lost-ack-and-same-tick-double-click');
    await page.evaluate(() => { window.__dropChatReceipt = true; });
    await page.getByLabel('메시지',{exact:true}).fill('합성 ACK 누락 검증');
    await page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find(item => item.textContent === '보내기');
      button.click(); button.click();
    });
    await page.getByRole('alert').filter({hasText:'전송 결과를 확인하지 못했습니다'}).waitFor({timeout:30000});
    const firstKeys = await page.evaluate(() => window.__chatRequests);
    assert(firstKeys.length === 1,'Same-tick double click emitted multiple sends');
    const first = (await get('/api/chats')).content[0];
    assert(first.latestSequence === 1,'Lost ACK did not preserve exactly one committed message');
    await page.getByRole('button',{name:'같은 메시지 다시 확인·전송',exact:true}).click();
    await page.waitForURL(/\/chats\/[0-9a-f-]{36}$/);
    const room = page.url().split('/').pop();
    const retryKeys = await page.evaluate(() => window.__chatRequests);
    assert(retryKeys.length === 2 && retryKeys[0] === retryKeys[1],'Ambiguous retry changed request ID');
    assert((await get('/api/chats/'+room+'/messages')).content.length === 1,'ACK retry duplicated original');
    checks.push('actual-commit-lost-ack-double-click-idempotent-retry');

    step('same-browser-disconnect-recovery');
    await receiver.evaluate(() => window.__chatSockets.forEach(socket => socket.close()));
    await send('합성 연결 복구 메시지');
    await wait(async () => await receiver.getByText('합성 연결 복구 메시지',{exact:true}).count() > 0);
    assert((await get('/api/chats/'+room)).latestSequence === 2,'Reconnect changed message count');
    checks.push('same-browser-reconnect-authoritative-rest-recovery');

    step('peer-app-stop-and-missed-redis-signal');
    if (await receiver.getByRole('button',{name:'새 채팅 알림 닫기'}).count()) {
      await receiver.getByRole('button',{name:'새 채팅 알림 닫기'}).click();
    }
    await faults.stopPeer();
    await send('합성 앱 재기동 복구');
    assert((await get('/api/chats/'+room)).latestSequence === 3,'Peer failure prevented durable send');
    await faults.startPeer();
    step('peer-authorized-rest-ready');
    await wait(async () => await receiver.getByText('합성 앱 재기동 복구',{exact:true}).count() > 0);
    checks.push('peer-restart-missed-pubsub-and-db-recovery');

    step('redis-unavailable-commit-and-repair');
    await page.getByText(/2,000자 · 연결됨/).waitFor({timeout:30000});
    await page.getByLabel('메시지',{exact:true}).fill('합성 Redis 장애 복구');
    await faults.pauseRedis(); // Auto-restored after six seconds even when the browser fails.
    await page.getByRole('button',{name:'보내기',exact:true}).click();
    await page.waitForTimeout(4500);
    await faults.resumeRedis();
    await wait(async () => (await get('/api/chats/'+room)).latestSequence === 4);
    await page.getByText(/2,000자 · 연결됨/).waitFor({timeout:30000});
    if (await page.getByRole('button',{name:'같은 메시지 다시 확인·전송',exact:true}).count()) {
      await page.getByRole('button',{name:'같은 메시지 다시 확인·전송',exact:true}).click();
    }
    await wait(async () => await page.getByLabel('메시지',{exact:true}).inputValue() === '');
    assert((await get('/api/chats/'+room+'/messages')).content.length === 4,'Redis repair duplicated or lost a committed message');
    checks.push('actual-redis-outage-db-preservation-and-repair');
    return {environment:'isolated-local-dev',checks,productionVerified:false};
  } catch (failure) {
    await page.screenshot({path:'/tmp/pawbridge-member-chat-recovery-failure.png',fullPage:true}).catch(()=>{});
    await receiver.screenshot({path:'/tmp/pawbridge-member-chat-recovery-receiver-failure.png',fullPage:true}).catch(()=>{});
    throw failure;
  } finally { await context.close(); }
}
