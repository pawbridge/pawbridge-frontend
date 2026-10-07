import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SseParser } from '../src/lib/privateNoteStream.ts';

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
