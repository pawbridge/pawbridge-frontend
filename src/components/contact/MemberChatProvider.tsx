import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';
import { getChatNotifications, issueChatTicket } from '../../api/memberChat.api';
import { getAuthSessionVersion, useAuthStore } from '../../store/authStore';
import {
  chatReconnectDelayMs, chatReconnectExtraWait, chatSignalFor, chatSocketUrl, memberChatEnabled,
} from '../../lib/memberChat';
import { requestChatTicket } from '../../lib/chatTicket';
import type { ChatReceipt, ChatRoom, ChatSend } from '../../types/memberChat';
import { ChatStreamSignalContext, MemberChatContext } from './useMemberChat';

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
  const visibleSession = useRef(-1);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<ChatRoom[]>([]);
  const [unread, setUnread] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  // 웹소켓을 쓰는 화면 수. 채팅 화면이 떠 있는 동안만 0보다 크다.
  const [socketUsers, setSocketUsers] = useState(0);
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

  // 쪽지 알림 스트림으로 온 채팅 신호. 채팅 화면 밖의 탭은 웹소켓이 없어 이 길로만 새 메시지를 안다.
  // 이 탭의 웹소켓이 연결돼 있으면 같은 신호가 그쪽으로 오므로 건너뛴다.
  const streamSignal = useCallback((data: string) => {
    if (!memberChatEnabled || !owner || !current() || socket.current?.connected) return;
    let value: unknown;
    try { value = JSON.parse(data); } catch { return; }
    if (!chatSignalFor(value, owner)) return;
    void refresh();
  }, [owner, current, refresh]);

  const openSocket = useCallback(() => {
    let open = true;
    setSocketUsers((count) => count + 1);
    return () => {
      if (!open) return;
      open = false;
      setSocketUsers((count) => count - 1);
    };
  }, []);
  const socketWanted = socketUsers > 0;

  // 로그인한 모든 탭: 채팅 알림 목록을 REST로 불러오고 화면 복귀와 60초 점검 때 다시 맞춘다.
  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    visibleSession.current = -1;
    revision.current++;
    loadedPages.current = 1;
    refreshState.current = { running: false, queued: false };
    paging.current = false;
    setNotifications([]); setUnread(0); setCursor(null); setError(false); setLoading(false);
    if (!memberChatEnabled || !token || !owner) return () => abort.abort();
    void refresh();
    const resume = () => { if (document.visibilityState === 'visible') void refresh(); };
    const repair = setInterval(resume, 60000);
    window.addEventListener('focus', resume);
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      abort.abort(); clearInterval(repair);
      clearTimeout(refreshTimer.current);
      window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [token, owner, session, current, refresh]);

  // 웹소켓은 채팅 화면이 떠 있는 동안만 연다. 탭마다 열면 회원당 연결 한도와 연결표 발급 제한에 걸린다.
  useEffect(() => {
    const abort = new AbortController();
    setConnected(false);
    const pending = new Map<string, AwaitingReceipt>();
    awaiting.current = pending;
    let authenticationRetry: ReturnType<typeof setTimeout> | undefined;
    // 마지막 연결 성공 뒤 시도 횟수. 연결표 실패로 다시 activate해도 이어서 센다.
    let attempts = 0;
    let skipWait: (() => void) | undefined;
    const waitBeforeAttempt = (milliseconds: number) => new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        abort.signal.removeEventListener('abort', done);
        if (skipWait === done) skipWait = undefined;
        resolve();
      };
      const timer = setTimeout(done, milliseconds);
      abort.signal.addEventListener('abort', done, { once: true });
      skipWait = done;
    });
    const rejectPending = () => {
      pending.forEach((receipt) => {
        clearTimeout(receipt.timer);
        receipt.reject(new Error('연결이 끊겼습니다. 같은 메시지로 다시 시도하세요.'));
      });
      pending.clear();
    };
    if (!memberChatEnabled || !token || !owner || !socketWanted) return () => abort.abort();
    const client = new Client({
      brokerURL: chatSocketUrl(import.meta.env.VITE_API_BASE_URL || '', window.location.origin),
      reconnectDelay: chatReconnectDelayMs,
      connectionTimeout: 10000,
      heartbeatIncoming: 15000,
      heartbeatOutgoing: 15000,
      debug: () => { /* Never print CONNECT credentials or private frames. */ },
      beforeConnect: async () => {
        if (abort.signal.aborted || !current()) return;
        // stompjs의 지수 모드는 연결에 성공해도 간격을 되돌리지 않아 여기서 직접 늘린다.
        const extraWait = chatReconnectExtraWait(attempts++);
        if (extraWait > 0) await waitBeforeAttempt(extraWait);
        if (abort.signal.aborted || !current()) return;
        try {
          const ticket = await requestChatTicket(owner, abort.signal, () => issueChatTicket(abort.signal));
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
        attempts = 0;
        setConnected(true);
        client.subscribe('/user/queue/chat', (frame) => {
          if (!current() || abort.signal.aborted) return;
          let value: ChatReceipt | { requestId?: string; status: number; message: string };
          try { value = JSON.parse(frame.body); } catch { return; }
          if ('requestId' in value && value.requestId) {
            const receipt = pending.get(value.requestId);
            if (receipt) {
              clearTimeout(receipt.timer);
              pending.delete(value.requestId);
              if ('status' in value) receipt.reject(Object.assign(new Error(value.message), { status: value.status }));
              else if ('roomId' in value) receipt.resolve(value);
            }
          }
          void refresh();
        });
        // 다시 연결되면 그사이 놓친 신호 대신 목록을 REST로 다시 받는다.
        void refresh();
      },
      onWebSocketClose: () => { if (current() && !abort.signal.aborted) setConnected(false); rejectPending(); },
      onStompError: () => { if (current() && !abort.signal.aborted) setError(true); },
    });
    socket.current = client;
    client.activate();
    // 탭을 다시 보거나 네트워크가 돌아오면 늘어난 대기를 버린다. 남는 대기는 stompjs의 5초뿐이다.
    const retryNow = () => {
      if (document.visibilityState !== 'visible') return;
      attempts = 0;
      skipWait?.();
    };
    window.addEventListener('online', retryNow);
    document.addEventListener('visibilitychange', retryNow);
    return () => {
      abort.abort(); rejectPending();
      clearTimeout(authenticationRetry);
      void client.deactivate({ force: true });
      if (socket.current === client) socket.current = null;
      window.removeEventListener('online', retryNow);
      document.removeEventListener('visibilitychange', retryNow);
    };
  }, [token, owner, session, current, refresh, socketWanted]);
  const visible = !!token && !!owner && visibleSession.current === session;
  return <MemberChatContext.Provider value={{
    connected, unread: visible ? unread : 0, notifications: visible ? notifications : [],
    error, hasMore: visible && cursor !== null, loading,
    send, refresh, more, openSocket,
  }}><ChatStreamSignalContext.Provider value={streamSignal}>{children}</ChatStreamSignalContext.Provider></MemberChatContext.Provider>;
}
