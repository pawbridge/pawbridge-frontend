import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import ContactLayout, { contactButton } from '../components/contact/ContactLayout';
import { useMemberChat } from '../components/contact/useMemberChat';
import { getChatMessages, getChatRoom, getChatRooms, hideChat, readChat } from '../api/memberChat.api';
import { blockNoteMember, getNoteRecipient } from '../api/privateNotes.api';
import { getAuthSessionVersion, useAuthStore } from '../store/authStore';
import { memberChatEnabled, mergeChatMessages, validChatBody } from '../lib/memberChat';
import type { ChatRoom, ChatSend } from '../types/memberChat';
import NotFound from './NotFound';

function RoomAvatar({ nickname }: { nickname: string }) {
  return <span aria-hidden="true" className="relative mt-1 flex h-8 w-8 shrink-0 items-center justify-center text-sm text-brand-ink">
    <img src="/contact/avatar-background.svg" alt="" width={32} height={32} className="absolute inset-0" />
    <span className="relative">{Array.from(nickname)[0]}</span>
  </span>;
}

function RoomRow({ room, selected }: { room: ChatRoom; selected: boolean }) {
  return <Link to={`/chats/${room.roomId}`} aria-current={selected ? 'page' : undefined}
    className={`flex min-w-0 gap-3 rounded-xl p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-focus ${selected ? 'bg-brand-soft dark:bg-gray-800' : 'hover:bg-brand-soft dark:hover:bg-gray-800'}`}>
    <RoomAvatar nickname={room.counterpartNickname} />
    <span className="min-w-0 flex-1">
      <span className="block break-words font-bold">{room.counterpartNickname}</span>
      <span className="mt-1 block truncate text-sm text-brand-muted dark:text-gray-400">{room.preview}</span>
      <span className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-brand-muted dark:text-gray-400">
        {room.unread && <span className="font-bold text-brand-ink dark:text-white">새 메시지</span>}
        <time dateTime={room.updatedAt} className="ml-auto">{new Date(room.updatedAt).toLocaleString('ko-KR')}</time>
      </span>
    </span>
  </Link>;
}

function ChatConversation({ roomId, recipientId }: { roomId?: string; recipientId?: number }) {
  const owner = useAuthStore((state) => state.user?.id);
  const session = getAuthSessionVersion();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queries = useQueryClient();
  const chat = useMemberChat();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const draft = useRef<ChatSend | null>(null);
  const submitting = useRef(false);
  const viewport = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const seenThrough = useRef(0);
  const readInFlight = useRef(false);
  const room = useQuery({
    queryKey: ['member-chat', owner, 'room', roomId],
    queryFn: ({ signal }) => getChatRoom(roomId!, signal), enabled: !!roomId, staleTime: 0,
  });
  const recipient = useQuery({
    queryKey: ['member-chat', owner, 'recipient', recipientId],
    queryFn: ({ signal }) => getNoteRecipient(recipientId!, signal),
    enabled: !roomId && !!recipientId, staleTime: 0,
  });
  const history = useInfiniteQuery({
    queryKey: ['member-chat', owner, 'history', roomId],
    queryFn: ({ pageParam, signal }) => getChatMessages(roomId!, pageParam, undefined, signal),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!roomId, staleTime: 0,
  });
  const messages = useMemo(() => mergeChatMessages(
    history.data?.pages.flatMap((page) => page.content) ?? [], [],
  ), [history.data]);
  const counterpart = room.data?.counterpartId ?? recipient.data?.userId;
  const nickname = room.data?.counterpartNickname ?? recipient.data?.nickname ?? '상대 회원';
  const canSend = roomId ? room.data?.canSend === true : recipient.data?.active === true;
  const counterpartRead = history.data?.pages[0]?.counterpartReadThrough ?? room.data?.counterpartReadThrough ?? 0;
  const tail = messages.at(-1)?.sequence;
  useEffect(() => {
    if (viewport.current && stickToBottom.current) viewport.current.scrollTop = viewport.current.scrollHeight;
  }, [tail]);

  useEffect(() => {
    if (!roomId || !viewport.current) return;
    const root = viewport.current;
    const visible = new Set<number>();
    const readVisible = async () => {
      if (document.visibilityState !== 'visible' || !document.hasFocus() || readInFlight.current
        || session !== getAuthSessionVersion() || !owner || owner !== useAuthStore.getState().user?.id) return;
      const through = Math.max(0, ...visible);
      if (through <= Math.max(seenThrough.current, room.data?.readThrough ?? 0)) return;
      readInFlight.current = true;
      try {
        await readChat(roomId, through);
        if (session !== getAuthSessionVersion()) return;
        seenThrough.current = through;
        void chat.refresh();
      } catch { /* Do not claim read on failure; the next visibility/repair cycle retries. */ }
      finally { readInFlight.current = false; }
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const sequence = Number((entry.target as HTMLElement).dataset.sequence);
        if (entry.isIntersecting) visible.add(sequence); else visible.delete(sequence);
      });
      void readVisible();
    }, { root, threshold: 0.6 });
    root.querySelectorAll('[data-sequence]').forEach((element) => observer.observe(element));
    const resume = () => { void readVisible(); };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    const retry = setInterval(resume, 15000);
    return () => {
      observer.disconnect(); clearInterval(retry);
      document.removeEventListener('visibilitychange', resume); window.removeEventListener('focus', resume);
    };
  }, [roomId, messages, room.data?.readThrough, session, owner, chat]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current || !canSend || !counterpart || !chat.connected || (!draft.current && !validChatBody(body))) return;
    submitting.current = true;
    if (!draft.current) {
      const context = params.get('context');
      const contextId = Number(params.get('contextId'));
      draft.current = { recipientId: counterpart, body: body.trim(), requestId: crypto.randomUUID() };
      if ((context === 'POST' || context === 'REPORT') && Number.isSafeInteger(contextId) && contextId > 0) {
        draft.current.contextType = context; draft.current.contextId = contextId;
      }
    }
    const request = draft.current;
    setSending(true); setFailure('');
    try {
      const receipt = await chat.send(request);
      if (session !== getAuthSessionVersion()) return;
      draft.current = null; setBody(''); setUncertain(false); stickToBottom.current = true;
      await chat.refresh();
      navigate(`/chats/${receipt.roomId}`, { replace: !roomId });
    } catch (error) {
      if (session !== getAuthSessionVersion()) return;
      const status = (error as { status?: number }).status;
      setFailure(error instanceof Error ? error.message : '전송 결과를 확인하지 못했습니다.');
      if (status && status >= 400 && status < 500) { draft.current = null; setUncertain(false); }
      else setUncertain(true); // Preserve both body and idempotency key for an ambiguous retry.
    } finally { submitting.current = false; if (session === getAuthSessionVersion()) setSending(false); }
  }

  async function manage(action: 'hide' | 'block') {
    if (!roomId || (action === 'block' && !counterpart)) return;
    if (!window.confirm(action === 'hide' ? '내 목록에서만 숨길까요? 새 메시지가 오면 다시 표시됩니다.' : '이 회원의 새 쪽지와 채팅을 차단할까요? 기존 기록은 남습니다.')) return;
    try {
      if (action === 'hide') await hideChat(roomId); else await blockNoteMember(counterpart!);
      await queries.invalidateQueries({ queryKey: ['member-chat', owner] });
      await chat.refresh();
      if (action === 'hide') navigate('/chats');
    } catch { setFailure('처리하지 못했습니다. 다시 시도해 주세요.'); }
  }

  if ((!roomId && !recipientId) || room.isError || recipient.isError) {
    return <section role="alert" className="rounded-xl border border-brand-border p-6">
      <p>대화를 열 수 없습니다. 상대 회원이나 접근 권한을 확인해 주세요.</p>
      <button className={`${contactButton} mt-4`} onClick={() => { if (roomId) void room.refetch(); else if (recipientId) void recipient.refetch(); }}>다시 시도</button>
    </section>;
  }
  return <section className="min-w-0 rounded-xl border border-brand-border bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-900">
    <div className="flex items-start gap-3"><RoomAvatar nickname={nickname} /><h3 className="min-w-0 break-words text-lg font-bold">{nickname}</h3></div>
    <p className="mt-3 text-sm text-brand-muted dark:text-gray-400">{roomId ? '같은 두 회원의 대화를 이어갑니다.' : '첫 메시지를 보내면 대화가 시작됩니다.'}</p>
    {history.isError && <p role="alert" className="mt-4">기록을 불러오지 못했어요. <button className={contactButton} onClick={() => void history.refetch()}>다시 시도</button></p>}
    <div ref={viewport} className="mt-4 max-h-[min(55dvh,560px)] min-h-48 overflow-y-auto overscroll-contain"
      aria-label="대화 메시지" tabIndex={0} onScroll={() => {
        const element = viewport.current!;
        stickToBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
      }}>
      {history.hasNextPage && <button type="button" className={`${contactButton} mb-4 w-full`}
        disabled={history.isFetchingNextPage} onClick={async () => {
          const element = viewport.current; const height = element?.scrollHeight ?? 0; const top = element?.scrollTop ?? 0;
          stickToBottom.current = false; await history.fetchNextPage();
          requestAnimationFrame(() => { if (element) element.scrollTop = top + element.scrollHeight - height; });
        }}>{history.isFetchingNextPage ? '불러오는 중…' : '이전 메시지 50개 더 보기'}</button>}
      {roomId && history.isPending && <p role="status">메시지를 불러오는 중입니다…</p>}
      {!roomId && <p className="rounded-xl bg-brand-soft p-4 text-brand-muted dark:bg-gray-800 dark:text-gray-400">상대에게 전달할 내용을 작성해 주세요.</p>}
      <ol className="space-y-3">{messages.map((message) => {
        const mine = message.senderId === owner;
        return <li key={message.sequence} data-sequence={message.sequence} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] break-words rounded-xl p-4 ${mine ? 'bg-brand text-brand-ink' : 'bg-gray-100 dark:bg-gray-800'}`}>
            {message.contextHref && <Link className="mb-2 inline-flex min-h-11 items-center text-sm underline" to={message.contextHref}>관련 글 보기</Link>}
            <p className="whitespace-pre-wrap text-base leading-7">{message.body}</p>
            <div className="mt-2 flex flex-wrap justify-end gap-2 text-xs">
              <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString('ko-KR')}</time>
              {mine && <span>{message.sequence <= counterpartRead ? '읽음' : '전송됨'}</span>}
            </div>
          </div>
        </li>;
      })}</ol>
    </div>
    {roomId && !messages.length && !history.isPending && !history.isError && <p className="mt-4 text-sm">보관 중인 메시지가 없습니다.</p>}
    <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-3">
      <label htmlFor="chat-message" className="block text-sm font-medium">메시지</label>
      <textarea id="chat-message" value={body} disabled={sending || uncertain || !canSend}
        onChange={(event) => setBody(event.target.value)} rows={3} aria-describedby="chat-compose-help"
        className="w-full rounded-lg border-brand-border text-base focus:border-brand-focus focus:ring-brand-focus disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900" />
      <p id="chat-compose-help" className="text-sm text-brand-muted dark:text-gray-400">{canSend ? `${Array.from(body.trim()).length.toLocaleString()} / 2,000자 · ${chat.connected ? '연결됨' : '연결 중'}` : '탈퇴하거나 차단된 상대에게는 새 메시지를 보낼 수 없습니다.'}</p>
      {failure && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{failure}</p>}
      <button type="submit" disabled={sending || !canSend || !chat.connected || (!uncertain && !validChatBody(body))}
        className={`${contactButton} w-full !border-brand bg-brand text-brand-ink`}>{sending ? '전송 중…' : uncertain ? '같은 메시지 다시 확인·전송' : '보내기'}</button>
    </form>
    {roomId && <div className="mt-6 rounded-xl bg-brand-soft p-4 text-sm dark:bg-gray-800">
      <h4 className="font-bold">대화 관리</h4>
      <div className="mt-2 flex flex-wrap gap-2">
        <button className={contactButton} onClick={() => void manage('hide')}>내 목록에서 숨기기</button>
        {counterpart && <button className={contactButton} onClick={() => void manage('block')}>회원 차단</button>}
      </div>
      <p className="mt-3 leading-6">숨겨도 기록은 유지되며 새 메시지가 오면 다시 표시됩니다. 차단은 새 쪽지와 채팅을 제한합니다. 상대방의 기록을 삭제하거나 대화를 영구 종료하지 않습니다.</p>
    </div>}
    <p className="mt-4 text-xs leading-5 text-brand-muted dark:text-gray-400">메시지는 발송일부터 최대 1년간 보관합니다. 개인정보는 본문에 작성하지 마세요.</p>
  </section>;
}

export default function MemberChats() {
  const { roomId } = useParams();
  const [params] = useSearchParams();
  const owner = useAuthStore((state) => state.user?.id);
  const recipientId = Number(params.get('to')) || undefined;
  const rooms = useInfiniteQuery({
    queryKey: ['member-chat', owner, 'rooms'],
    queryFn: ({ pageParam, signal }) => getChatRooms(pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: memberChatEnabled && !!owner, staleTime: 0,
  });
  if (!memberChatEnabled) return <NotFound />;
  const selected = !!roomId || !!recipientId;
  const content = [...new Map((rooms.data?.pages.flatMap((page) => page.content) ?? []).map((room) => [room.roomId, room])).values()];
  return <ContactLayout active="chats">
    <h2 className="text-2xl font-bold">{selected ? '1:1 대화' : '채팅'}</h2>
    <p className="mt-3 text-sm text-brand-muted dark:text-gray-400">회원과 주고받은 대화를 이어가세요.</p>
    {selected && <Link className={`${contactButton} mt-4 lg:hidden`} to="/chats">대화 목록으로</Link>}
    <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className={selected ? 'hidden lg:block' : ''} aria-label="대화 목록">
        {rooms.isPending && <p role="status" className="p-4">대화를 불러오는 중입니다…</p>}
        {rooms.isError && <p role="alert" className="p-4">목록을 불러오지 못했어요. <button className={contactButton} onClick={() => void rooms.refetch()}>다시 시도</button></p>}
        {!rooms.isPending && !rooms.isError && !content.length && <p className="rounded-xl bg-brand-soft p-4 leading-7 dark:bg-gray-800">아직 대화가 없습니다. 글 작성자의 닉네임에서 1:1 대화를 시작할 수 있어요.</p>}
        <ul>{content.map((room) => <li key={room.roomId}><RoomRow room={room} selected={roomId === room.roomId} /></li>)}</ul>
        {rooms.hasNextPage && <button type="button" className={`${contactButton} mt-4 w-full`} disabled={rooms.isFetchingNextPage}
          onClick={() => void rooms.fetchNextPage()}>{rooms.isFetchingNextPage ? '불러오는 중…' : '대화 10개 더 보기'}</button>}
        {!!content.length && <p className="mt-2 text-center text-xs text-brand-muted dark:text-gray-400">대화 {content.length}개 불러옴</p>}
      </aside>
      {selected ? <ChatConversation key={`${owner}:${getAuthSessionVersion()}:${roomId ?? `new:${recipientId}`}`} roomId={roomId} recipientId={recipientId} />
        : <section className="hidden self-start rounded-xl bg-brand-soft p-6 lg:block dark:bg-gray-800"><h3 className="text-lg font-bold">대화를 선택해 주세요</h3><p className="mt-3 text-sm leading-6">목록에서 회원을 선택하면 기존 기록을 확인할 수 있어요.</p></section>}
    </div>
    {!selected && <p className="mt-6 rounded-xl bg-brand-soft p-4 text-sm leading-6 dark:bg-gray-800">대화 목록에서 숨겨도 기록은 유지됩니다. 새 메시지가 오면 목록에 다시 나타납니다.</p>}
  </ContactLayout>;
}
