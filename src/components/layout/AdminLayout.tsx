import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import StatsDialog from '../statistics/StatsDialog';
import { adminControl } from '../admin/AdminUI';
import { adminSection } from '../../lib/adminNavigation';
import ManagementBreadcrumb from '../common/ManagementBreadcrumb';

export default function AdminLayout({ title, description, breadcrumb, children }: { title: string; description?: string; breadcrumb?: ReactNode; children: ReactNode }) {
  const { pathname } = useLocation();
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
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-brand-border bg-surface-light px-4 lg:h-[72px] lg:px-6 dark:border-stone-700 dark:bg-surface-dark">
        <button type="button" className={`${adminControl} lg:hidden`} aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>메뉴</button>
        <span className="min-w-0 flex-1 text-sm font-medium"><span className="lg:hidden">관리자 콘솔</span><span className="hidden lg:inline">관리자 콘솔 / {adminSection(pathname)}</span></span>
        <div className="flex shrink-0 items-center gap-2 text-sm"><span className="relative flex size-8 items-center justify-center text-brand-ink"><img src="/admin/avatar-background.svg" alt="" width="32" height="32" className="absolute inset-0" /><span className="relative">AD</span></span><span className="hidden lg:inline">관리자</span></div>
      </header>
      <main className="min-w-0 flex-1 space-y-6 p-4 lg:space-y-8 lg:p-8">
        {breadcrumb ?? <ManagementBreadcrumb current={title} collapseAncestors={false} separatorSrc="/admin/breadcrumb-separator.svg" items={[{ label: '관리자', to: '/admin/dashboard' }, ...(pathname === '/admin/dashboard' ? [] : [{ label: adminSection(pathname), to: adminSection(pathname) === '커뮤니티 관리' ? '/admin/posts' : adminSection(pathname) === '펫마켓' ? '/admin/products' : '/admin/dashboard' }])]} />}
        <div className="space-y-3"><h1 className="text-[28px] font-bold leading-[42px] lg:text-[34px] lg:leading-[1.25]">{title}</h1>{description && <p className="text-sm text-brand-muted dark:text-stone-300">{description}</p>}</div>
        {children}
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-border bg-surface-light p-4 text-xs lg:hidden dark:border-stone-700 dark:bg-surface-dark"><span>PawBridge · 관리자</span><Link className={adminControl} to="/">사용자 화면으로</Link></footer>
    </div>
    {menuOpen && <StatsDialog fullScreen title="PawBridge · 관리자" onClose={() => setMenuOpen(false)}><AdminSidebar mobile onNavigate={() => setMenuOpen(false)} /></StatsDialog>}
  </div>;
}
