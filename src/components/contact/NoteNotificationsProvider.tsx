import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAuthSessionVersion, useAuthStore } from '../../store/authStore';
import { getNoteNotifications } from '../../api/privateNotes.api';
import { consumeNoteStream, noteStreamRetryDelay } from '../../lib/privateNoteStream';
import { loadNoteNotificationWindow } from '../../lib/noteNotificationWindow';
import type { NoteNotification } from '../../types/privateNotes';
import { NotificationsContext } from './useNoteNotifications';
export default function NoteNotificationsProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const sessionVersion = getAuthSessionVersion();
  const client = useQueryClient();
  const [items, setItems] = useState<NoteNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState<NoteNotification | null>(null);
  const streamAbortController = useRef<AbortController | null>(null);
  const loadingMore = useRef(false);
  const knownNoteIds = useRef(new Set<string>());
  const visibleSessionVersion = useRef(-1);
  const refreshRevision = useRef(0);
  const loadedPages = useRef(1);
  const isCurrentSession = useCallback(
    () =>
      accessToken === useAuthStore.getState().accessToken &&
      currentUserId === useAuthStore.getState().user?.id &&
      sessionVersion === getAuthSessionVersion(),
    [accessToken, currentUserId, sessionVersion],
  );
  const refresh = useCallback(async () => {
    if (!accessToken || !currentUserId || !isCurrentSession()) return;
    const requestRevision = ++refreshRevision.current;
    try {
      const signal = streamAbortController.current?.signal;
      const data = await loadNoteNotificationWindow(
        (cursor) => getNoteNotifications(cursor, signal),
        loadedPages.current,
      );
      if (!isCurrentSession() || requestRevision !== refreshRevision.current) return;
      visibleSessionVersion.current = sessionVersion;
      loadedPages.current = data.pagesLoaded;
      data.content.forEach((item) => knownNoteIds.current.add(item.noteId));
      while (knownNoteIds.current.size > 1024)
        knownNoteIds.current.delete(knownNoteIds.current.values().next().value!);
      setItems(data.content);
      setCursor(data.nextCursor);
      setUnread(data.unreadCount);
      setError(false);
      void client.invalidateQueries({ queryKey: ['private-notes', currentUserId] });
    } catch {
      if (
        isCurrentSession() &&
        requestRevision === refreshRevision.current &&
        !streamAbortController.current?.signal.aborted
      )
        setError(true);
    }
  }, [accessToken, currentUserId, isCurrentSession, client, sessionVersion]);
  const more = useCallback(async () => {
    if (!cursor || loadingMore.current || !isCurrentSession()) return;
    loadingMore.current = true;
    setLoading(true);
    const requestRevision = refreshRevision.current;
    try {
      const data = await getNoteNotifications(cursor, streamAbortController.current?.signal);
      if (!isCurrentSession() || requestRevision !== refreshRevision.current) return;
      // A refresh started before this page opened must not replace the newly expanded list.
      refreshRevision.current += 1;
      setItems((previous) => [
        ...new Map([...previous, ...data.content].map((item) => [item.noteId, item])).values(),
      ]);
      data.content.forEach((item) => knownNoteIds.current.add(item.noteId));
      if (data.content.length > 0) loadedPages.current += 1;
      setCursor(data.nextCursor);
      setUnread(data.unreadCount);
      setError(false);
    } catch {
      if (isCurrentSession() && !streamAbortController.current?.signal.aborted) setError(true);
    } finally {
      if (isCurrentSession()) {
        loadingMore.current = false;
        setLoading(false);
      }
    }
  }, [cursor, isCurrentSession]);
  useEffect(() => {
    const controller = new AbortController();
    streamAbortController.current = controller;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let delay = 1000;
    knownNoteIds.current = new Set();
    loadingMore.current = false;
    visibleSessionVersion.current = -1;
    refreshRevision.current += 1;
    loadedPages.current = 1;
    setItems([]);
    setUnread(0);
    setCursor(null);
    setToast(null);
    setError(false);
    setLoading(false);
    if (!accessToken || !currentUserId) return () => controller.abort();
    void refresh();
    async function connect() {
      if (controller.signal.aborted || !isCurrentSession() || !accessToken) return;
      let retryFailure: unknown;
      try {
        await consumeNoteStream(
          `${import.meta.env.VITE_API_BASE_URL || ''}/api/notes/stream`,
          accessToken,
          controller.signal,
          (event) => {
            if (!isCurrentSession() || controller.signal.aborted) return;
            delay = 1000;
            if (event.event === 'ready' || event.event === 'resync') {
              void refresh();
              return;
            }
            if (event.event !== 'note') return;
            const item = JSON.parse(event.data) as NoteNotification;
            // Reject malformed paths before exposing a notification link.
            if (
              item.kind !== 'PRIVATE_NOTE' ||
              !/^[0-9a-f-]{36}$/i.test(item.noteId) ||
              item.href !== `/notes/${item.noteId}`
            )
              return;
            if (!knownNoteIds.current.has(item.noteId)) {
              knownNoteIds.current.add(item.noteId);
              visibleSessionVersion.current = sessionVersion;
              setToast(item);
            }
            void refresh();
          },
        );
      } catch (failure) {
        retryFailure = failure;
        if (!controller.signal.aborted && isCurrentSession()) {
          const status = (failure as { status?: number }).status;
          if (status === 401) {
            useAuthStore.getState().clearAuth();
            return;
          }
        }
      }
      if (!controller.signal.aborted && isCurrentSession()) {
        retryTimer = setTimeout(() => {
          void connect();
        }, noteStreamRetryDelay(retryFailure, delay));
        delay = Math.min(delay * 2, 30000);
      }
    }
    void connect();
    const resume = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    window.addEventListener('focus', resume);
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    // Repairs a missed after-commit push, rolling overlap or a saturated SSE queue even while connected.
    const repair = setInterval(resume, 60000);
    return () => {
      controller.abort();
      clearTimeout(retryTimer);
      clearInterval(repair);
      window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [accessToken, currentUserId, sessionVersion, isCurrentSession, refresh]);
  const visible =
    !!accessToken && !!currentUserId && visibleSessionVersion.current === sessionVersion;
  return (
    <NotificationsContext.Provider
      value={{
        items: visible ? items : [],
        unread: visible ? unread : 0,
        loading,
        error,
        hasMore: visible && cursor !== null,
        refresh,
        more,
        toast: visible ? toast : null,
        dismissToast: () => setToast(null),
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
