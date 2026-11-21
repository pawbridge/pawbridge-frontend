import test from 'node:test';
import assert from 'node:assert/strict';
import {
  existingChatPath, mergeChatMessages, validChatBody, chatSocketUrl, chatReconnectDelayMs, chatReconnectExtraWait,
  chatSignalFor, isNewChatMessage,
} from '../src/lib/memberChat.ts';
import type { ChatMessage, ChatSignal } from '../src/types/memberChat.ts';

function message(sequence: number, body = '합성 메시지'): ChatMessage {
  return { roomId: 'synthetic-room', sequence, body, senderId: 1, contextHref: null, createdAt: '2026-10-10T01:00:00Z' };
}
test('recontact selects existing room while preserving only a valid public post context', () => {
  assert.equal(existingChatPath('room', new URLSearchParams('to=7&context=REPORT&contextId=23&other=value')), '/chats/room?context=REPORT&contextId=23');
  assert.equal(existingChatPath('room', new URLSearchParams('context=POST&contextId=24')), '/chats/room?context=POST&contextId=24');
  for (const query of ['', 'context=OTHER&contextId=1', 'context=REPORT', 'contextId=1', 'context=POST&contextId=0', 'context=POST&contextId=9007199254740992']) {
    assert.equal(existingChatPath('room', new URLSearchParams(query)), '/chats/room');
  }
});
test('history and realtime recovery deduplicate by sequence and keep latest at bottom', () => {
  const merged = mergeChatMessages([message(3), message(1)], [message(2), message(3)]);
  assert.deepEqual(merged.map((item) => item.sequence), [1, 2, 3]);
});
test('body uses Unicode code points and rejects empty, null and unpaired surrogate input', () => {
  assert.equal(validChatBody('🐈'.repeat(2000)), true);
  assert.equal(validChatBody('🐈'.repeat(2001)), false);
  for (const input of [' ', '\0', '\uD800']) assert.equal(validChatBody(input), false);
});
test('WebSocket URL preserves TLS and never contains authentication values', () => {
  assert.equal(chatSocketUrl('https://api.example.invalid', 'https://site.example.invalid'), 'wss://api.example.invalid/api/v1/chats/socket');
  assert.equal(chatSocketUrl('', 'http://localhost:5184'), 'ws://localhost:5184/api/v1/chats/socket');
});

test('chat reconnect waits double from ten seconds up to five minutes until a connection succeeds', () => {
  const zero = () => 0;
  const totals = [0, 1, 2, 3, 4, 5, 6, 7].map((attempt) => chatReconnectExtraWait(attempt, zero) + (attempt ? chatReconnectDelayMs : 0));
  assert.deepEqual(totals, [0, 10_000, 20_000, 40_000, 80_000, 160_000, 300_000, 300_000]);
  assert.equal(chatReconnectExtraWait(2, () => 0.999), 15_999);
  assert.equal(chatReconnectExtraWait(-1, () => 0.999), 0);
});

test('chat signal is accepted only in the server shape and only for the signed-in member', () => {
  const signal = { memberId: 7, kind: 'MESSAGE', roomId: 'synthetic-room', sequence: 3 };
  assert.deepEqual(chatSignalFor(signal, 7), signal);
  assert.deepEqual(chatSignalFor({ ...signal, body: '합성 본문' }, 7), signal);
  for (const kind of ['SENT', 'READ', 'HIDDEN']) assert.equal(chatSignalFor({ ...signal, kind }, 7)?.kind, kind);
  assert.equal(chatSignalFor({ ...signal, kind: 'HIDDEN', sequence: 0 }, 7)?.sequence, 0);
  assert.equal(chatSignalFor(signal, 8), null);
  for (const value of [null, 'MESSAGE', 3, [], { ...signal, kind: 'WITHDRAWN' }, { ...signal, kind: 1 },
    { ...signal, roomId: '' }, { ...signal, roomId: 5 }, { ...signal, sequence: '3' }, { ...signal, sequence: -1 },
    { ...signal, sequence: 1.5 }, { ...signal, sequence: 2 ** 53 }, { ...signal, memberId: '7' }]) {
    assert.equal(chatSignalFor(value, 7), null);
  }
});

test('the same new message signal is announced once even when the socket and the note stream both deliver it', () => {
  const known = new Map<string, number>();
  const signal = (kind: ChatSignal['kind'], roomId: string, sequence: number): ChatSignal => ({ memberId: 7, kind, roomId, sequence });
  assert.equal(isNewChatMessage(known, signal('MESSAGE', 'a', 3)), true);
  assert.equal(isNewChatMessage(known, signal('MESSAGE', 'a', 3)), false);
  assert.equal(isNewChatMessage(known, signal('MESSAGE', 'a', 2)), false);
  assert.equal(isNewChatMessage(known, signal('MESSAGE', 'b', 3)), true);
  assert.equal(isNewChatMessage(known, signal('MESSAGE', 'a', 4)), true);
  // 보냄, 읽음, 숨김 신호는 알리지 않고 기억한 순번도 바꾸지 않는다.
  for (const kind of ['SENT', 'READ', 'HIDDEN'] as const) assert.equal(isNewChatMessage(known, signal(kind, 'a', 9)), false);
  assert.equal(isNewChatMessage(known, signal('MESSAGE', 'a', 5)), true);
  assert.deepEqual([...known], [['a', 5], ['b', 3]]);
});

test('remembered rooms are bounded and the oldest room is forgotten first', () => {
  const known = new Map<string, number>();
  for (const roomId of ['a', 'b', 'c']) {
    assert.equal(isNewChatMessage(known, { memberId: 7, kind: 'MESSAGE', roomId, sequence: 1 }, 2), true);
  }
  assert.deepEqual([...known.keys()], ['b', 'c']);
});
