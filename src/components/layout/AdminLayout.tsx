import { Suspense, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import StatsDialog from '../statistics/StatsDialog';
import { adminControl } from '../admin/AdminUI';
import { adminSection } from '../../lib/adminNavigation';
import ManagementBreadcrumb from '../common/ManagementBreadcrumb';
import ErrorBoundary from '../common/ErrorBoundary';
import { ScreenErrorCard } from '../common/ScreenErrorFallback';
import { PageLoadingStatus } from '../common/PageLoading';

// 관리자 화면 묶음의 공통 틀(사이드바·상단바). 화면은 <Outlet /> 자리에 AdminPageHeader와 자기 내용만 그린다.
// 화면이 그리다 오류를 내면 사이드바·상단바는 두고 내용 자리에만 안내 카드를 보여 준다. 다른 주소로 이동하면 다시 그린다.
// 화면 코드를 처음 받아 오는 동안에는 내용 자리만 비워 둔다.
export default function AdminLayout() {
  const location = useLocation();
  const { pathname } = location;
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const onChange = () => { if (media.matches) setMenuOpen(false); };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return <div className="flex min-h-dvh bg-stone-100 font-sans text-brand-ink dark:bg-background-dark dark:text-white">
    <div className="sticky top-0 hidden h-dvh shrink-0 lg:block"><AdminSidebar /></div>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-brand-border bg-surface-light px-4 sm:gap-4 lg:h-[72px] lg:px-6 dark:border-stone-700 dark:bg-surface-dark">
        <button type="button" className={`${adminControl} lg:hidden`} aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>메뉴</button>
        <span className="min-w-0 flex-1 truncate text-sm font-medium"><span className="lg:hidden">관리자 콘솔</span><span className="hidden lg:inline">관리자 콘솔 / {adminSection(pathname)}</span></span>
        <Link to="/" className={`${adminControl} shrink-0 whitespace-nowrap !px-3 sm:!px-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus`}>메인페이지</Link>
        <div className="flex shrink-0 items-center gap-2 text-sm"><span className="relative flex size-8 items-center justify-center text-brand-ink"><img src="/admin/avatar-background.svg" alt="" width="32" height="32" className="absolute inset-0" /><span className="relative">AD</span></span><span className="hidden lg:inline">관리자</span></div>
      </header>
      <main className="min-w-0 flex-1 space-y-6 p-4 lg:space-y-8 lg:p-8">
        <ErrorBoundary resetKey={location.key} fallback={<ScreenErrorCard />}>
          <Suspense fallback={<PageLoadingStatus />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-border bg-surface-light p-4 text-xs lg:hidden dark:border-stone-700 dark:bg-surface-dark"><span>PawBridge · 관리자</span><Link className={adminControl} to="/">사용자 화면으로</Link></footer>
    </div>
    {menuOpen && <StatsDialog fullScreen title="PawBridge · 관리자" onClose={() => setMenuOpen(false)}><AdminSidebar mobile onNavigate={() => setMenuOpen(false)} /></StatsDialog>}
  </div>;
}

// 관리자 화면 맨 위의 경로 표시·제목·설명. breadcrumb를 주지 않으면 현재 주소의 관리 영역으로 만든다.
export function AdminPageHeader({ title, description, breadcrumb }: { title: string; description?: string; breadcrumb?: ReactNode }) {
  const { pathname } = useLocation();
  return <>
    {breadcrumb ?? <ManagementBreadcrumb current={title} collapseAncestors={false} separatorSrc="/admin/breadcrumb-separator.svg" items={[{ label: '관리자', to: '/admin/dashboard' }, ...(pathname === '/admin/dashboard' ? [] : [{ label: adminSection(pathname), to: adminSection(pathname) === '커뮤니티 관리' ? '/admin/posts' : adminSection(pathname) === '펫마켓' ? '/admin/products' : '/admin/dashboard' }])]} />}
    <div className="space-y-3"><h1 className="text-[28px] font-bold leading-[42px] lg:text-[34px] lg:leading-[1.25]">{title}</h1>{description && <p className="text-sm text-brand-muted dark:text-stone-300">{description}</p>}</div>
  </>;
}
