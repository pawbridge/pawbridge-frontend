import type { NoteNotification, NoteNotifications } from '../types/privateNotes';

type FetchNotificationPage = (cursor?: string) => Promise<NoteNotifications>;

export interface NoteNotificationWindow extends NoteNotifications {
  pagesLoaded: number;
}

/** Re-query every opened page so refresh preserves history and removes deleted/expired entries. */
export async function loadNoteNotificationWindow(
  fetchPage: FetchNotificationPage,
  requestedPages: number,
): Promise<NoteNotificationWindow> {
  const notifications = new Map<string, NoteNotification>();
  let nextCursor: string | null = null;
  let unreadCount = 0;
  let pagesLoaded = 0;

  for (let pageIndex = 0; pageIndex < requestedPages; pageIndex += 1) {
    const page = await fetchPage(nextCursor ?? undefined);
    page.content.forEach((notification) => notifications.set(notification.noteId, notification));
    nextCursor = page.nextCursor;
    unreadCount = page.unreadCount;
    pagesLoaded += 1;
    if (nextCursor === null) break;
  }

  return {
    content: [...notifications.values()],
    nextCursor,
    unreadCount,
    pagesLoaded,
  };
}
