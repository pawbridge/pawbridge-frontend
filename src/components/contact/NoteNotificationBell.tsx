import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNoteNotifications } from './useNoteNotifications';
import { useMemberChat } from './useMemberChat';
import { memberChatEnabled } from '../../lib/memberChat';

export default function NoteNotificationBell() {
  const notifications = useNoteNotifications();
  const chat = useMemberChat();
  const totalUnread = notifications.unread + chat.unread;
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  return (
    <div
      ref={container}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false);
          button.current?.focus();
        }
      }}
    >
      <button
        ref={button}
        type="button"
        aria-label={`연락 알림, 읽지 않은 쪽지 ${notifications.unread}개${memberChatEnabled ? `, 새 메시지가 있는 대화 ${chat.unread}개` : ''}`}
        aria-expanded={open}
        aria-controls="private-note-notifications"
        onClick={() => {
          setOpen(!open);
        }}
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-brand-ink hover:bg-brand-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-focus dark:text-white dark:hover:bg-gray-800"
      >
        <img src="/contact/bell.svg" alt="" width={20} height={20} />
        {totalUnread > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 rounded-full bg-brand px-1.5 text-xs font-bold text-brand-ink"
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
      {open && (
        <section
          id="private-note-notifications"
          aria-label="연락 알림 목록"
          className="fixed left-4 right-4 top-20 z-50 w-[calc(100vw-32px)] rounded-xl border border-brand-border bg-white p-4 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-14 sm:w-[350px] dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold">쪽지 알림</h2>
            <Link
              to="/notes"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center text-sm underline"
            >
              쪽지함
            </Link>
          </div>
          <div className="max-h-[50dvh] overflow-y-auto">
            {memberChatEnabled && <section aria-label="채팅 알림" className="mb-4 rounded-xl bg-brand-soft p-3 dark:bg-gray-800">
              <div className="flex items-center justify-between gap-3"><h3 className="font-bold">채팅 알림</h3><Link to="/chats" onClick={() => setOpen(false)} className="flex min-h-11 items-center underline">대화 목록</Link></div>
              {chat.notifications.map((room) => <Link key={room.roomId} to={`/chats/${room.roomId}`}
                onClick={() => setOpen(false)} className="my-2 block rounded-lg bg-white p-3 focus-visible:outline-brand-focus dark:bg-gray-900">
                <p className="text-sm font-medium">{room.counterpartNickname}님에게 새 메시지가 왔어요</p>
                <time dateTime={room.updatedAt} className="mt-1 block text-xs text-brand-muted dark:text-gray-400">{new Date(room.updatedAt).toLocaleString('ko-KR')}</time>
              </Link>)}
              {!chat.notifications.length && !chat.error && <p className="py-3 text-sm">새 채팅 알림이 없습니다.</p>}
              {chat.error && <p role="status" className="text-sm">채팅 알림을 불러오지 못했어요. <button className="min-h-11 underline" onClick={() => void chat.refresh()}>다시 시도</button></p>}
              {chat.hasMore && <button className="min-h-11 w-full rounded-lg border border-brand-border" disabled={chat.loading} onClick={() => void chat.more()}>{chat.loading ? '불러오는 중…' : '이전 채팅 알림 더 보기'}</button>}
            </section>}
            {notifications.items.map((item) => (
              <Link
                key={item.noteId}
                to={item.href}
                onClick={() => setOpen(false)}
                className={`my-2 block rounded-lg p-3 focus-visible:outline focus-visible:outline-brand-focus ${item.read ? 'bg-gray-50 dark:bg-gray-800' : 'bg-brand-soft dark:bg-gray-800'}`}
              >
                <p className="text-sm font-medium">{item.actorNickname}님에게 쪽지가 왔어요</p>
                <time
                  dateTime={item.createdAt}
                  className="mt-1 block text-xs text-brand-muted dark:text-gray-400"
                >
                  {new Date(item.createdAt).toLocaleString('ko-KR')}
                </time>
                {!item.read && <span className="mt-1 block text-xs font-bold">읽지 않음</span>}
              </Link>
            ))}
            {!notifications.items.length && !notifications.error && (
              <p className="py-6 text-center text-sm text-brand-muted">새 쪽지 알림이 없습니다.</p>
            )}
            {notifications.error && (
              <p role="status" className="py-3 text-sm">
                알림을 불러오지 못했어요.{' '}
                <button
                  type="button"
                  onClick={() => void notifications.refresh()}
                  className="min-h-11 underline"
                >
                  다시 시도
                </button>
              </p>
            )}
            {notifications.hasMore && (
              <button
                type="button"
                disabled={notifications.loading}
                onClick={() => void notifications.more()}
                className="min-h-11 w-full rounded-lg border border-brand-border text-sm"
              >
                {notifications.loading ? '불러오는 중…' : '이전 알림 더 보기'}
              </button>
            )}
          </div>
        </section>
      )}
      {notifications.toast && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-32px)] items-center gap-3 rounded-xl border border-brand-border bg-white p-4 shadow-lg dark:bg-gray-900"
        >
          <Link
            to={notifications.toast.href}
            onClick={notifications.dismissToast}
            className="min-h-11 content-center text-sm"
          >
            {notifications.toast.actorNickname}님에게 새 쪽지가 왔어요
          </Link>
          <button
            type="button"
            aria-label="새 쪽지 알림 닫기"
            onClick={notifications.dismissToast}
            className="h-11 w-11"
          >
            ×
          </button>
        </div>
      )}
      {memberChatEnabled && chat.toast && <div role="status" className="fixed bottom-24 right-4 z-50 flex max-w-[calc(100vw-32px)] items-center gap-3 rounded-xl border border-brand-border bg-white p-4 shadow-lg dark:bg-gray-900">
        <Link to={`/chats/${chat.toast.roomId}`} onClick={chat.dismissToast} className="min-h-11 content-center text-sm">{chat.toast.counterpartNickname}님에게 새 메시지가 왔어요</Link>
        <button type="button" className="h-11 w-11" aria-label="새 채팅 알림 닫기" onClick={chat.dismissToast}>×</button>
      </div>}
    </div>
  );
}
