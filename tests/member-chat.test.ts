import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeChatMessages, validChatBody, chatSocketUrl } from '../src/lib/memberChat.ts';
import type { ChatMessage } from '../src/types/memberChat.ts';

function message(sequence: number, body = '합성 메시지'): ChatMessage {
  return { roomId: 'synthetic-room', sequence, body, senderId: 1, contextHref: null, createdAt: '2026-10-10T01:00:00Z' };
}
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
  assert.equal(chatSocketUrl('https://api.example.invalid', 'https://site.example.invalid'), 'wss://api.example.invalid/api/chats/socket');
  assert.equal(chatSocketUrl('', 'http://localhost:5184'), 'ws://localhost:5184/api/chats/socket');
});
