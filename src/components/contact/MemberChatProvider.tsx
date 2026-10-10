import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';
import { getChatNotifications, issueChatTicket } from '../../api/memberChat.api';
import { getAuthSessionVersion, useAuthStore } from '../../store/authStore';
import { chatSocketUrl, memberChatEnabled } from '../../lib/memberChat';
import type { ChatReceipt, ChatRoom, ChatSend, ChatSignal } from '../../types/memberChat';
import { MemberChatContext } from './useMemberChat';

type AwaitingReceipt = {
  resolve: (receipt: ChatReceipt) => void;
  reject: (failure: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

export default function MemberChatProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.accessToken);
  const owner = useAuthStore((state) => state.user?.id);
  const session = getAuthSessionVersion();
  const queries = useQueryClient();
  const socket = useRef<Client | null>(null);
  const controller = useRef<AbortController | null>(null);
  const awaiting = useRef(new Map<string, AwaitingReceipt>());
  const paging = useRef(false);
  const revision = useRef(0);
  const loadedPages = useRef(1);
  const refreshState = useRef({ running: false, queued: false });
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const known = useRef(new Map<string, number>());
  const visibleSession = useRef(-1);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<ChatRoom[]>([]);
  const [unread, setUnread] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ChatRoom | null>(null);
  const current = useCallback(() => token === useAuthStore.getState().accessToken
    && owner === useAuthStore.getState().user?.id && session === getAuthSessionVersion(), [token, owner, session]);

  const refresh = useCallback(async (): Promise<void> => {
    if (!memberChatEnabled || !token || !owner || !current()) return;
    const state = refreshState.current;
    if (state.running) { state.queued = true; return; }
    state.running = true;
    const request = ++revision.current;
    try {
      const data = await getChatNotifications(undefined, controller.current?.signal);
      const content = [...data.content];
      let next = data.nextCursor;
      let pages = 1;
      while (next && pages < loadedPages.current) {
        const page = await getChatNotifications(next, controller.current?.signal);
        content.push(...page.content);
        if (page.nextCursor === next) break;
        next = page.nextCursor;
        pages++;
      }
      if (!current() || request !== revision.current) return;
      visibleSession.current = session;
      loadedPages.current = pages;
      setNotifications([...new Map(content.map((room) => [room.roomId, room])).values()]);
      setUnread(data.unreadCount);
      setCursor(next);
      setError(false);
      void queries.invalidateQueries({ queryKey: ['member-chat', owner] });
    } catch {
      if (current() && request === revision.current && !controller.current?.signal.aborted) setError(true);
    } finally {
      state.running = false;
      if (state.queued && current() && refreshState.current === state && !controller.current?.signal.aborted) {
        state.queued = false;
        refreshTimer.current = setTimeout(() => void refresh(), 200);
      }
    }
  }, [token, owner, session, current, queries]);

  const more = useCallback(async () => {
    if (!cursor || paging.current || !current()) return;
    paging.current = true;
    setLoading(true);
    const request = revision.current;
    try {
      const data = await getChatNotifications(cursor, controller.current?.signal);
      if (!current() || request !== revision.current) return;
      revision.current++;
      if (data.content.length) loadedPages.current++;
      setNotifications((previous) => [...new Map([...previous, ...data.content].map((room) => [room.roomId, room])).values()]);
      setCursor(data.nextCursor);
      setUnread(data.unreadCount);
    } catch {
      if (current() && !controller.current?.signal.aborted) setError(true);
    } finally {
      if (current()) { paging.current = false; setLoading(false); }
    }
  }, [cursor, current]);

  const send = useCallback((input: ChatSend) => new Promise<ChatReceipt>((resolve, reject) => {
    if (!current() || !socket.current?.connected) { reject(new Error('연결 중입니다. 잠시 후 다시 시도하세요.')); return; }
    if (awaiting.current.has(input.requestId) || awaiting.current.size >= 10) {
      reject(new Error('전송 중입니다.')); return;
    }
    const pending = awaiting.current;
    const timer = setTimeout(() => {
      pending.delete(input.requestId);
      reject(new Error('전송 결과를 확인하지 못했습니다. 같은 메시지로 다시 시도하세요.'));
    }, 20000);
    pending.set(input.requestId, { resolve, reject, timer });
    try { socket.current.publish({ destination: '/app/chat/send', body: JSON.stringify(input) }); }
    catch {
      clearTimeout(timer);
      pending.delete(input.requestId);
      reject(new Error('전송 결과를 확인하지 못했습니다. 같은 메시지로 다시 시도하세요.'));
    }
  }), [current]);

  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    visibleSession.current = -1;
    revision.current++;
    known.current.clear();
    loadedPages.current = 1;
    refreshState.current = { running: false, queued: false };
    paging.current = false;
    setNotifications([]); setUnread(0); setCursor(null); setToast(null); setConnected(false); setError(false); setLoading(false);
    const pending = new Map<string, AwaitingReceipt>();
    awaiting.current = pending;
    let authenticationRetry: ReturnType<typeof setTimeout> | undefined;
    const rejectPending = () => {
      pending.forEach((receipt) => {
        clearTimeout(receipt.timer);
        receipt.reject(new Error('연결이 끊겼습니다. 같은 메시지로 다시 시도하세요.'));
      });
      pending.clear();
    };
    if (!memberChatEnabled || !token || !owner) return () => abort.abort();
    const client = new Client({
      brokerURL: chatSocketUrl(import.meta.env.VITE_API_BASE_URL || '', window.location.origin),
      reconnectDelay: 5000,
      connectionTimeout: 10000,
      heartbeatIncoming: 15000,
      heartbeatOutgoing: 15000,
      debug: () => { /* Never print CONNECT credentials or private frames. */ },
      beforeConnect: async () => {
        if (abort.signal.aborted || !current()) return;
        try {
          const ticket = await issueChatTicket(abort.signal);
          if (!current() || abort.signal.aborted) return;
          client.connectHeaders = { ticket: ticket.ticket };
        } catch {
          client.connectHeaders = {};
          if (!abort.signal.aborted && current()) {
            setError(true);
            // Abort this attempt instead of opening an unauthenticated socket.
            await client.deactivate({ force: true });
            authenticationRetry = setTimeout(() => {
              if (!abort.signal.aborted && current()) client.activate();
            }, 5000);
          }
        }
      },
      onConnect: () => {
        if (!current() || abort.signal.aborted) { void client.deactivate({ force: true }); return; }
        client.connectHeaders = {};
        setConnected(true);
        client.subscribe('/user/queue/chat', (frame) => {
          if (!current() || abort.signal.aborted) return;
          let value: ChatReceipt | ChatSignal | { requestId?: string; status: number; message: string };
          try { value = JSON.parse(frame.body); } catch { return; }
          if ('requestId' in value && value.requestId) {
            const receipt = pending.get(value.requestId);
            if (receipt) {
              clearTimeout(receipt.timer);
              pending.delete(value.requestId);
              if ('status' in value) receipt.reject(Object.assign(new Error(value.message), { status: value.status }));
              else if ('roomId' in value) receipt.resolve(value);
            }
          } else if ('kind' in value && value.memberId === owner && value.kind === 'MESSAGE') {
            const signal = value;
            const previous = known.current.get(signal.roomId) ?? 0;
            if (signal.sequence > previous) {
              known.current.set(signal.roomId, signal.sequence);
              while (known.current.size > 1024) known.current.delete(known.current.keys().next().value!);
              // A signal has no message body. Resolve the room display through authorized REST.
              void getChatNotifications(undefined, abort.signal).then((data) => {
                if (!current() || abort.signal.aborted) return;
                const room = data.content.find((item) => item.roomId === signal.roomId);
                if (room) setToast(room);
              }).catch(() => {});
            }
          }
          void refresh();
        });
        void refresh(); // Recovery is authoritative, not a replay of old toasts.
      },
      onWebSocketClose: () => { if (current() && !abort.signal.aborted) setConnected(false); rejectPending(); },
      onStompError: () => { if (current() && !abort.signal.aborted) setError(true); },
    });
    socket.current = client;
    client.activate();
    void refresh();
    const resume = () => { if (document.visibilityState === 'visible') void refresh(); };
    const repair = setInterval(resume, 60000);
    window.addEventListener('focus', resume);
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      abort.abort(); rejectPending(); clearInterval(repair);
      clearTimeout(authenticationRetry);
      clearTimeout(refreshTimer.current);
      void client.deactivate({ force: true });
      if (socket.current === client) socket.current = null;
      window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [token, owner, session, current, refresh]);
  const visible = !!token && !!owner && visibleSession.current === session;
  return <MemberChatContext.Provider value={{
    connected, unread: visible ? unread : 0, notifications: visible ? notifications : [],
    error, hasMore: visible && cursor !== null, loading, toast: visible ? toast : null,
    send, refresh, more, dismissToast: () => setToast(null),
  }}>{children}</MemberChatContext.Provider>;
}
