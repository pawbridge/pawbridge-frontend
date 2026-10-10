import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { memberChatEnabled } from '../../lib/memberChat';

export default function AuthorContact({
  memberId,
  nickname,
  contextType,
  contextId,
}: {
  memberId: number;
  nickname: string;
  contextType?: 'POST' | 'REPORT';
  contextId?: number;
}) {
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (
        !root.current?.contains(event.target as Node) &&
        !menu.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const moved = () => setOpen(false);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', moved);
    window.addEventListener('scroll', moved, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', moved);
      window.removeEventListener('scroll', moved, true);
    };
  }, [open]);
  if (memberId <= 0 || memberId === user?.id) return <span>{nickname}</span>;
  const params = new URLSearchParams({ to: String(memberId) });
  if (contextType && contextId) {
    params.set('context', contextType);
    params.set('contextId', String(contextId));
  }
  const href = `/notes/new?${params}`;
  return (
    <span ref={root} className="relative inline-block">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-label={`${nickname}에게 연락하기`}
        onClick={(event) => {
          event.stopPropagation();
          const bounds = event.currentTarget.getBoundingClientRect();
          setPosition({
            left: Math.max(8, Math.min(bounds.left, window.innerWidth - 184)),
            top: Math.max(8, Math.min(bounds.bottom + 4, window.innerHeight - (memberChatEnabled ? 120 : 76))),
          });
          setOpen((value) => !value);
        }}
        className="min-h-11 rounded-lg px-2 text-left hover:bg-brand-soft hover:text-brand-ink focus-visible:outline-brand-focus"
      >
        {nickname}
      </button>
      {open &&
        createPortal(
          <span
            ref={menu}
            style={position}
            className="fixed z-50 block w-44 rounded-xl border border-brand-border bg-white p-2 text-sm text-brand-ink shadow-lg"
          >
            <Link
              to={user ? href : '/login'}
              state={user ? undefined : { from: href }}
              className="flex min-h-11 items-center rounded-lg px-3 hover:bg-brand-soft"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
              }}
            >
              쪽지 보내기
            </Link>
            {memberChatEnabled && <Link
              to={user ? `/chats/new?${params}` : '/login'}
              state={user ? undefined : { from: `/chats/new?${params}` }}
              className="flex min-h-11 items-center rounded-lg px-3 hover:bg-brand-soft focus-visible:outline-brand-focus"
              onClick={(event) => { event.stopPropagation(); setOpen(false); }}
            >1:1 대화</Link>}
          </span>,
          document.body,
        )}
    </span>
  );
}
