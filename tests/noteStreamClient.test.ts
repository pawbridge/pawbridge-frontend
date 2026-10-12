import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNoteStreamClientId } from '../src/lib/noteStreamClient.ts';

const first = '00000000-0000-4000-8000-000000000001';
const second = '00000000-0000-4000-8000-000000000002';
function storage(initial?: string) {
  let value = initial ?? null;
  return { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } };
}
test('a reload reuses only that tab previous stream identity', () => {
  const tab = storage();
  assert.equal(createNoteStreamClientId(tab, 'navigate', () => first), first);
  assert.equal(createNoteStreamClientId(tab, 'reload', () => second), first);
});
test('a newly opened tab with copied session storage gets its own identity', () => {
  const original = storage(first);
  const copied = storage(first);
  assert.equal(createNoteStreamClientId(copied, 'navigate', () => second), second);
  assert.equal(createNoteStreamClientId(original, 'reload', () => second), first);
});
test('independent browsers have independent identities and reload keeps each', () => {
  const a = storage(), b = storage();
  createNoteStreamClientId(a, 'navigate', () => first);
  createNoteStreamClientId(b, 'navigate', () => second);
  assert.equal(createNoteStreamClientId(a, 'reload', () => second), first);
  assert.equal(createNoteStreamClientId(b, 'reload', () => first), second);
});
test('corrupt persisted identity is discarded before reconnecting', () => {
  assert.equal(createNoteStreamClientId(storage('bad'), 'reload', () => first), first);
});
test('unavailable storage does not prevent notifications connecting', () => {
  const denied = { getItem: () => { throw new Error('storage denied'); }, setItem: () => { throw new Error('storage denied'); } };
  assert.equal(createNoteStreamClientId(denied, 'reload', () => first), first);
});
