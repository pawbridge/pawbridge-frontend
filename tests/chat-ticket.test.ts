import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatTicketIssuer } from '../src/lib/chatTicket.ts';

function timing(initial = 100000) {
  let time = initial;
  const values = new Map<string, string>();
  const waits: number[] = [];
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  return { values, waits, storage, now: () => time, advance: (ms: number) => { time += ms; },
    wait: async (ms: number, signal: AbortSignal) => { signal.throwIfAborted(); waits.push(ms); time += ms; } };
}
const active = () => new AbortController().signal;
const limited = () => Object.assign(new Error('rate limited'), { response: { status: 429 } });

test('first connection is immediate and a reload waits for the prior server response cooldown', async () => {
  const clock = timing(), first = createChatTicketIssuer(clock);
  const ticket = { ticket: 'not-persisted', expiresAt: 999999 };
  assert.equal(await first(12, active(), async () => { clock.advance(300); return ticket; }), ticket);
  assert.deepEqual(clock.waits, []);
  const reloaded = createChatTicketIssuer(clock);
  await reloaded(12, active(), async () => ticket);
  assert.deepEqual(clock.waits, [2100]);
  assert.ok([...clock.values.values()].every(value => /^\d+$/.test(value)));
  assert.ok(![...clock.values.values()].includes(ticket.ticket));
});
test('member timing does not delay another account', async () => {
  const clock = timing(), issue = createChatTicketIssuer(clock);
  await issue(12, active(), async () => 'first');
  await issue(13, active(), async () => 'second');
  assert.deepEqual(clock.waits, []);
});
test('another browser 429 retries inside authentication after the issuance window', async () => {
  const clock = timing(), issue = createChatTicketIssuer(clock);
  let attempts = 0;
  const ticket = await issue(12, active(), async () => { attempts++; if (attempts === 1) throw limited(); return 'fresh-single-use-ticket'; });
  assert.equal(ticket, 'fresh-single-use-ticket');
  assert.equal(attempts, 2);
  assert.deepEqual(clock.waits, [2100]);
});
test('persistent 429 is bounded to three requests instead of an unlimited inner loop', async () => {
  const clock = timing(), issue = createChatTicketIssuer(clock);
  let attempts = 0;
  await assert.rejects(issue(12, active(), async () => { attempts++; throw limited(); }));
  assert.equal(attempts, 3);
  assert.deepEqual(clock.waits, [2100, 2100]);
});
test('unauthorized, unavailable and transport failures are not retried as rate limits', async () => {
  for (const failure of [Object.assign(new Error(), { response: { status: 401 } }), Object.assign(new Error(), { response: { status: 503 } }), new Error('network')]) {
    const clock = timing(), issue = createChatTicketIssuer(clock); let attempts = 0;
    await assert.rejects(issue(12, active(), async () => { attempts++; throw failure; }), value => value === failure);
    assert.equal(attempts, 1); assert.deepEqual(clock.waits, []);
  }
});
test('logout during cooldown cancels before issuing another ticket', async () => {
  const clock = timing(), cancel = new AbortController();
  const issue = createChatTicketIssuer({ ...clock, wait: async () => { cancel.abort(); } });
  await issue(12, active(), async () => 'first'); let attempted = false;
  await assert.rejects(issue(12, cancel.signal, async () => { attempted = true; return 'second'; }), { name: 'AbortError' });
  assert.equal(attempted, false);
});
test('an already aborted document sends no authentication request', async () => {
  const cancel = new AbortController(); cancel.abort(); let attempted = false;
  await assert.rejects(createChatTicketIssuer(timing())(12, cancel.signal, async () => { attempted = true; }), { name: 'AbortError' });
  assert.equal(attempted, false);
});
test('an aborted pending response cannot return a ticket to a new auth session', async () => {
  const cancel = new AbortController();
  await assert.rejects(createChatTicketIssuer(timing())(12, cancel.signal, async () => { cancel.abort(); return 'abandoned'; }), { name: 'AbortError' });
});
test('disabled storage preserves document cooldown and still permits connecting', async () => {
  const clock = timing();
  const issue = createChatTicketIssuer({ ...clock, storage: { getItem: () => { throw Error('denied'); }, setItem: () => { throw Error('denied'); } } });
  await issue(12, active(), async () => 'first'); await issue(12, active(), async () => 'second');
  assert.deepEqual(clock.waits, [2100]);
});
test('corrupt and far-future storage cannot hold authentication indefinitely', async () => {
  for (const value of ['bad', 'Infinity', '999999999999999', '-1']) {
    const clock = timing(); clock.values.set('pawbridge-chat-ticket-next-v1:12', value);
    await createChatTicketIssuer(clock)(12, active(), async () => 'first'); assert.deepEqual(clock.waits, []);
  }
});
test('a reservation made by another tab while sleeping is checked again before sending', async () => {
  const clock = timing(); let changed = false;
  const issue = createChatTicketIssuer({ ...clock, wait: async (ms, signal) => {
    await clock.wait(ms, signal);
    if (!changed) { changed = true; clock.values.set('pawbridge-chat-ticket-next-v1:12', String(clock.now() + 2100)); }
  } });
  await issue(12, active(), async () => 'first'); await issue(12, active(), async () => 'second');
  assert.deepEqual(clock.waits, [2100, 2100]);
});
test('actual abortable timer is removed when the document closes', async () => {
  const cancel = new AbortController();
  const issue = createChatTicketIssuer({ storage: { getItem: () => String(Date.now() + 2100), setItem: () => {} } });
  const waiting = issue(12, cancel.signal, async () => { assert.fail('must not send after abort'); });
  cancel.abort(); await assert.rejects(waiting, { name: 'AbortError' });
});
test('a denied browser lock falls back to cooldown without disabling chat', async () => {
  const clock = timing();
  const issue = createChatTicketIssuer({ ...clock, locks: { request: async () => { throw new DOMException('denied', 'SecurityError'); } } });
  assert.equal(await issue(12, active(), async () => 'first'), 'first');
  assert.equal(await issue(12, active(), async () => 'second'), 'second');
  assert.deepEqual(clock.waits, [2100]);
});
test('an aborted lock queue cannot fall back and issue a ticket', async () => {
  const clock = timing(); let attempted = false;
  const issue = createChatTicketIssuer({ ...clock, locks: { request: async () => { throw new DOMException('canceled', 'AbortError'); } } });
  await assert.rejects(issue(12, active(), async () => { attempted = true; }), { name: 'AbortError' });
  assert.equal(attempted, false);
});
