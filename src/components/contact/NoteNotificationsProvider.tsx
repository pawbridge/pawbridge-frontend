import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAuthSessionVersion, useAuthStore } from '../../store/authStore';
import { getNoteNotifications } from '../../api/privateNotes.api';
import { consumeNoteStream } from '../../lib/privateNoteStream';
import type { NoteNotification } from '../../types/privateNotes';
import { NotificationsContext } from './useNoteNotifications';
export default function NoteNotificationsProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore(state => state.accessToken);
  const owner = useAuthStore(state => state.user?.id);
  const session = getAuthSessionVersion();
  const client = useQueryClient();
  const [items, setItems] = useState<NoteNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState<NoteNotification | null>(null);
  const active = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const known = useRef(new Set<string>());
  const scope = useRef(-1);
  const revision = useRef(0);
  const current = useCallback(() => token === useAuthStore.getState().accessToken && owner === useAuthStore.getState().user?.id && session === getAuthSessionVersion(), [token, owner, session]);
  const refresh = useCallback(async () => {
    if (!token || !owner || !current()) return;
    const requestRevision = ++revision.current;
    try {
      const data = await getNoteNotifications(undefined, active.current?.signal);
      if (!current() || requestRevision !== revision.current) return;
      scope.current = session;
      data.content.forEach(item => known.current.add(item.noteId));
      while (known.current.size > 1024) known.current.delete(known.current.values().next().value!);
      setItems(data.content); setCursor(data.nextCursor); setUnread(data.unreadCount); setError(false);
      void client.invalidateQueries({ queryKey: ['private-notes', owner] });
    } catch { if (current() && requestRevision === revision.current && !active.current?.signal.aborted) setError(true); }
  }, [token, owner, current, client, session]);
  const more = useCallback(async () => {
    if (!cursor || busy.current || !current()) return;
    busy.current = true; setLoading(true);
    const requestRevision = revision.current;
    try {
      const data = await getNoteNotifications(cursor, active.current?.signal);
      if (!current() || requestRevision !== revision.current) return;
      setItems(previous => [...new Map([...previous, ...data.content].map(item => [item.noteId, item])).values()]);
      data.content.forEach(item => known.current.add(item.noteId));
      setCursor(data.nextCursor); setUnread(data.unreadCount); setError(false);
    } catch { if (current() && !active.current?.signal.aborted) setError(true); }
    finally { if (current()) { busy.current = false; setLoading(false); } }
  }, [cursor, current]);
  useEffect(() => {
    const controller = new AbortController(); active.current = controller;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let delay = 1000;
    known.current = new Set(); busy.current = false; scope.current = -1; revision.current += 1;
    setItems([]); setUnread(0); setCursor(null); setToast(null); setError(false); setLoading(false);
    if (!token || !owner) return () => controller.abort();
    void refresh();
    async function connect() {
      if (controller.signal.aborted || !current() || !token) return;
      try {
        await consumeNoteStream(`${import.meta.env.VITE_API_BASE_URL || ''}/api/notes/stream`, token, controller.signal, event => {
          if (!current() || controller.signal.aborted) return;
          delay = 1000;
          if (event.event === 'ready' || event.event === 'resync') { void refresh(); return; }
          if (event.event !== 'note') return;
          const item = JSON.parse(event.data) as NoteNotification;
          // Reject malformed paths before exposing a notification link.
          if (item.kind !== 'PRIVATE_NOTE' || !/^[0-9a-f-]{36}$/i.test(item.noteId) || item.href !== `/notes/${item.noteId}`) return;
          if (!known.current.has(item.noteId)) { known.current.add(item.noteId); scope.current = session; setToast(item); }
          void refresh();
        });
      } catch (failure) {
        if (!controller.signal.aborted && current()) {
          const status = (failure as { status?: number }).status;
          if (status === 401) { useAuthStore.getState().clearAuth(); return; }
          if (status === 429) delay = 30000;
        }
      }
      if (!controller.signal.aborted && current()) {
        retryTimer = setTimeout(() => { void connect(); }, delay);
        delay = Math.min(delay * 2, 30000);
      }
    }
    void connect();
    const resume = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', resume); window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    // Repairs a missed after-commit push, rolling overlap or a saturated SSE queue even while connected.
    const repair = setInterval(resume, 60000);
    return () => {
      controller.abort(); clearTimeout(retryTimer); clearInterval(repair);
      window.removeEventListener('focus', resume); window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [token, owner, session, current, refresh]);
  const visible = !!token && !!owner && scope.current === session;
  return <NotificationsContext.Provider value={{ items: visible ? items : [], unread: visible ? unread : 0, loading, error, hasMore: visible && cursor !== null, refresh, more, toast: visible ? toast : null, dismissToast: () => setToast(null) }}>{children}</NotificationsContext.Provider>;
}
