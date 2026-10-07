import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  consumeNoteStream, NoteStreamError, noteStreamRetryDelay, retryAfterMilliseconds, SseParser,
} from '../src/lib/privateNoteStream.ts';

test('SSE frames survive split CRLF, multiline data, comments and multiple events', () => {
  const parser = new SseParser();
  assert.deepEqual(parser.feed(': heartbeat\r\nevent: note\r\nda'), []);
  assert.deepEqual(parser.feed('ta: {"id":1}\r\ndata: second\r\n\r'), []);
  assert.deepEqual(parser.feed('\nevent: resync\ndata: {}\n\n'), [
    { event: 'note', data: '{"id":1}\nsecond' }, { event: 'resync', data: '{}' },
  ]);
});
test('an incomplete oversized frame is rejected instead of retaining unbounded memory', () => {
  assert.throws(() => new SseParser().feed('a'.repeat(65537)), /수신 크기/);
});

test('Retry-After accepts bounded seconds and a future HTTP date without shortening the hint', () => {
  const now = Date.parse('Wed, 07 Oct 2026 00:00:00 GMT');
  assert.equal(retryAfterMilliseconds('15', now), 15_000);
  assert.equal(retryAfterMilliseconds(' 15 ', now), 15_000);
  assert.equal(retryAfterMilliseconds('0', now), 1000);
  assert.equal(retryAfterMilliseconds('300', now), 300_000);
  assert.equal(retryAfterMilliseconds('Wed, 07 Oct 2026 00:00:15 GMT', now), 15_000);
});

test('invalid, negative, fractional, past and oversized Retry-After values use fallback', () => {
  const now = Date.parse('Wed, 07 Oct 2026 00:00:00 GMT');
  for (const value of [null, '', '-1', '1.5', 'Infinity', '301', '9999999999', 'a'.repeat(129),
    'Tue, 06 Oct 2026 23:59:59 GMT', 'Wed, 99 Foo 2026 00:00:00 GMT',
    'Foo, 07 Oct 2026 00:00:15 GMT', 'Tue, 07 Oct 2026 00:00:15 GMT',
    'Thu, 31 Sep 2026 00:00:15 GMT']) {
    assert.equal(retryAfterMilliseconds(value, now), undefined, String(value));
  }
  assert.equal(retryAfterMilliseconds('Thu, 31 Sep 2026 00:00:15 GMT',
    Date.parse('Thu, 01 Oct 2026 00:00:00 GMT')), undefined);
});

test('429 retries add bounded jitter after the server delay and preserve the old missing-hint fallback', () => {
  assert.equal(noteStreamRetryDelay(new NoteStreamError(429, 15_000), 1000, () => 0), 15_000);
  assert.equal(noteStreamRetryDelay(new NoteStreamError(429, 15_000), 1000, () => 0.999), 15_999);
  assert.equal(noteStreamRetryDelay(new NoteStreamError(429), 1000, () => 0), 30_000);
  assert.equal(noteStreamRetryDelay(new TypeError('synthetic network failure'), 4000, () => 0.5), 4500);
  assert.equal(noteStreamRetryDelay(undefined, 1000, () => 0), 1000);
});

test('transport preserves 429 retry metadata and releases the error response without reading private contents', async (t) => {
  let cancelled = false;
  t.mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({
    cancel() { cancelled = true; },
  }), { status: 429, headers: { 'Retry-After': '15' } }));
  await assert.rejects(
    consumeNoteStream('http://local.invalid/stream', 'synthetic-token', new AbortController().signal, () => {}),
    (error: unknown) => error instanceof NoteStreamError && error.status === 429 && error.retryAfterMs === 15_000,
  );
  assert.equal(cancelled, true);
});

test('transport keeps missing or invalid retry hints undefined and preserves 401', async (t) => {
  for (const [status, hint] of [[429, 'bad'], [429, ''], [401, '15']] as const) {
    t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status, headers: { 'Retry-After': hint } }));
    await assert.rejects(
      consumeNoteStream('http://local.invalid/stream', 'synthetic-token', new AbortController().signal, () => {}),
      (error: unknown) => error instanceof NoteStreamError && error.status === status && error.retryAfterMs === undefined,
    );
  }
});

test('aborting during a received frame stops later events and cancels the reader', async (t) => {
  const controller = new AbortController();
  let cancelled = false;
  const events: string[] = [];
  t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    assert.deepEqual(init.headers, { Authorization: 'Bearer synthetic-token', Accept: 'text/event-stream' });
    assert.equal(init.signal, controller.signal);
    return new Response(new ReadableStream({
      start(source) { source.enqueue(new TextEncoder().encode('event: ready\ndata: {}\n\nevent: note\ndata: {}\n\n')); },
      cancel() { cancelled = true; },
    }), { headers: { 'Content-Type': 'text/event-stream' } });
  });
  await consumeNoteStream('http://local.invalid/stream', 'synthetic-token', controller.signal, event => {
    events.push(event.event);
    controller.abort();
  });
  assert.deepEqual(events, ['ready']);
  assert.equal(cancelled, true);
});
