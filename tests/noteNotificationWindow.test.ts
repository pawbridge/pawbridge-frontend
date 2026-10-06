import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadNoteNotificationWindow } from '../src/lib/noteNotificationWindow.ts';
import type { NoteNotification, NoteNotifications } from '../src/types/privateNotes.ts';

function notification(index: number, read = false): NoteNotification {
  const noteId = `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
  return {
    noteId,
    kind: 'PRIVATE_NOTE',
    actorId: 2,
    actorNickname: '합성 회원',
    createdAt: '2026-10-06T08:00:00Z',
    read,
    href: `/notes/${noteId}`,
  };
}

function pagesFrom(items: NoteNotification[]) {
  const cursors: (string | undefined)[] = [];
  return {
    cursors,
    async fetch(cursor?: string): Promise<NoteNotifications> {
      cursors.push(cursor);
      const offset = cursor ? items.findIndex((item) => item.noteId === cursor) + 1 : 0;
      const content = items.slice(offset, offset + 20);
      return {
        content,
        nextCursor: offset + 20 < items.length ? content.at(-1)!.noteId : null,
        unreadCount: items.filter((item) => !item.read).length,
      };
    },
  };
}

test('initial load requests only the first page', async () => {
  const source = pagesFrom(Array.from({ length: 50 }, (_, index) => notification(index)));
  const result = await loadNoteNotificationWindow(source.fetch, 1);
  assert.equal(result.content.length, 20);
  assert.equal(result.pagesLoaded, 1);
  assert.deepEqual(source.cursors, [undefined]);
});

test('refresh keeps both opened pages instead of replacing forty notifications with twenty', async () => {
  const items = Array.from({ length: 50 }, (_, index) => notification(index));
  const source = pagesFrom(items);
  const result = await loadNoteNotificationWindow(source.fetch, 2);
  assert.deepEqual(result.content, items.slice(0, 40));
  assert.equal(result.nextCursor, items[39].noteId);
  assert.deepEqual(source.cursors, [undefined, items[19].noteId]);
});

test('refresh updates read state and drops deleted entries in older opened pages', async () => {
  const items = Array.from({ length: 40 }, (_, index) => notification(index, index === 25));
  const deleted = items[30];
  const retained = items.filter((item) => item.noteId !== deleted.noteId);
  const result = await loadNoteNotificationWindow(pagesFrom(retained).fetch, 2);
  assert.equal(result.content.length, 39);
  assert.equal(result.content.find((item) => item.noteId === items[25].noteId)?.read, true);
  assert.equal(
    result.content.some((item) => item.noteId === deleted.noteId),
    false,
  );
  assert.equal(result.unreadCount, 38);
});

test('refresh follows the new first-page cursor after a new notification arrives', async () => {
  const previous = Array.from({ length: 40 }, (_, index) => notification(index));
  const incoming = notification(100);
  const source = pagesFrom([incoming, ...previous]);
  const result = await loadNoteNotificationWindow(source.fetch, 2);
  assert.deepEqual(result.content, [incoming, ...previous].slice(0, 40));
  assert.deepEqual(source.cursors, [undefined, previous[18].noteId]);
});

test('end of history stops further requests and overlapping rows are deduplicated', async () => {
  let calls = 0;
  const first = notification(1);
  const second = notification(2);
  const result = await loadNoteNotificationWindow(async (cursor) => {
    calls += 1;
    return cursor
      ? { content: [first, second], nextCursor: null, unreadCount: 2 }
      : { content: [first], nextCursor: first.noteId, unreadCount: 2 };
  }, 5);
  assert.equal(calls, 2);
  assert.equal(result.pagesLoaded, 2);
  assert.deepEqual(result.content, [first, second]);
});

test('failure on an older page rejects the refresh instead of returning a partial replacement', async () => {
  await assert.rejects(
    loadNoteNotificationWindow(async (cursor) => {
      if (cursor) throw new Error('synthetic older-page outage');
      return { content: [notification(1)], nextCursor: notification(1).noteId, unreadCount: 1 };
    }, 2),
    /older-page outage/,
  );
});
