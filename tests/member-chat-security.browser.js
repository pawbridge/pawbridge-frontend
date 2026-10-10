// Uses real single-use tickets, Redis leases and both local Community apps. No production target.
async (page, accounts) => {
  await page.goto('http://127.0.0.1:5184/login');
  return page.evaluate(async ({ token }) => {
    const { Client } = await import('/node_modules/@stomp/stompjs/esm6/index.js');
    const checks = [];
    const clients = [];
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const ticket = async () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        const response = await fetch('http://localhost:28080/api/chats/connection-ticket', {
          method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: '{}',
        });
        if (response.status === 429) { await delay(2100); continue; }
        if (!response.ok) throw new Error('Security ticket issuance failed');
        return (await response.json()).data.ticket;
      }
      throw new Error('Security ticket issuance timed out');
    };
    const connect = async (credential, port = 28080) => {
      let fail, reject;
      const failure = new Promise(resolve => { fail = resolve; });
      let timer;
      const client = new Client({
        brokerURL: `ws://localhost:${port}/api/chats/socket`, connectHeaders: { ticket: credential },
        reconnectDelay: 0, heartbeatIncoming: 15000, heartbeatOutgoing: 15000, debug: () => {},
      });
      const ready = new Promise((resolve, denied) => {
        reject = denied;
        timer = setTimeout(() => denied(new Error('Security connect timed out')), 16000);
        client.onConnect = () => { clearTimeout(timer); resolve(); };
        client.onStompError = frame => {
          clearTimeout(timer); fail(frame); denied(new Error('Rejected as expected'));
        };
        client.onWebSocketClose = () => {
          clearTimeout(timer); fail(null); denied(new Error('Closed as expected'));
        };
        client.onWebSocketError = () => { clearTimeout(timer); reject(new Error('Transport error')); };
      });
      clients.push(client);
      client.activate();
      return { client, ready, failure };
    };
    const deniedConnect = async credential => {
      const connection = await connect(credential);
      try { await connection.ready; throw new Error('Forbidden connection accepted'); }
      catch (error) {
        if (!['Rejected as expected', 'Closed as expected'].includes(error.message)) throw error;
      } finally { await connection.client.deactivate({ force: true }); }
    };
    const forbiddenFrame = async action => {
      const connection = await connect(await ticket());
      await connection.ready;
      action(connection.client);
      const response = await Promise.race([
        connection.failure,
        delay(16000).then(() => { throw new Error('Forbidden frame did not close connection'); }),
      ]);
      if (response && response.body.includes('synthetic-private-content')) throw new Error('Protocol error leaked submitted content');
      await connection.client.deactivate({ force: true });
    };
    try {
      console.log('[chat-check] security-unauthenticated');
      await deniedConnect('');
      checks.push('unauthenticated-stomp-connect-denied');
      const credential = await ticket();
      console.log('[chat-check] security-ticket-replay');
      const original = await connect(credential);
      await original.ready;
      await original.client.deactivate({ force: true });
      await deniedConnect(credential);
      checks.push('actual-single-use-ticket-replay-denied');

      console.log('[chat-check] security-foreign-subscription');
      await forbiddenFrame(client => client.subscribe('/user/another-member/queue/chat', () => {}));
      checks.push('foreign-user-subscription-denied');
      console.log('[chat-check] security-forbidden-send');
      await forbiddenFrame(client => client.publish({ destination: '/queue/chat', body: 'synthetic-private-content' }));
      checks.push('direct-broker-send-denied-without-private-body-echo');

      // A cluster-wide limit: two connections on A and one on B occupy all three member slots.
      const occupied = [];
      console.log('[chat-check] security-cross-app-limit');
      for (const port of [28080, 28180, 28080]) {
        const connection = await connect(await ticket(), port);
        await connection.ready; occupied.push(connection.client);
      }
      await deniedConnect(await ticket());
      checks.push('actual-cross-app-three-connection-limit');
      await occupied[0].deactivate({ force: true });
      await delay(300);
      const replacement = await connect(await ticket(), 28180);
      await replacement.ready;
      checks.push('closed-connection-releases-member-slot');
      return { environment: 'isolated-local-dev', checks, productionVerified: false };
    } finally {
      await Promise.all(clients.map(client => client.deactivate({ force: true })));
    }
  }, { token: accounts[0].token });
}
