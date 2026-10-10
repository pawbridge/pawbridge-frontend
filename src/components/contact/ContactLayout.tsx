import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import { memberChatEnabled } from '../../lib/memberChat';

export const contactButton =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-border px-4 text-sm font-medium transition-colors hover:bg-brand-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800';
export default function ContactLayout({
  children,
  active = 'notes',
}: {
  children: ReactNode;
  active?: 'notes' | 'chats' | 'blocks';
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background-light font-display text-brand-ink dark:bg-background-dark dark:text-white">
      <Header />
      <main className="mx-auto w-full max-w-[1248px] flex-1 px-4 py-8 sm:py-12">
        <h1 className="text-[28px] font-bold leading-[42px]">연락 공간</h1>
        <p className="mt-2 text-sm leading-6 text-brand-muted dark:text-gray-400">
          {memberChatEnabled ? '쪽지와 1:1 대화를 주고받고 나의 연락을 관리하세요.' : '쪽지를 주고받고 나의 연락을 관리하세요.'}
        </p>
        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:gap-8">
          <nav
            aria-label="연락 공간 메뉴"
            className="flex gap-3 lg:w-[220px] lg:shrink-0 lg:flex-col"
          >
            {[
              { id: 'notes', href: '/notes', label: '쪽지' },
              ...(memberChatEnabled ? [{ id: 'chats', href: '/chats', label: '채팅' }] : []),
              { id: 'blocks', href: '/notes/blocks', label: '차단 관리' },
            ].map((item) => (
              <Link
                key={item.id}
                to={item.href}
                aria-current={active === item.id ? 'page' : undefined}
                className={`${contactButton} flex-1 !justify-start lg:flex-none ${active === item.id ? 'border-brand bg-brand font-bold text-brand-ink' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
