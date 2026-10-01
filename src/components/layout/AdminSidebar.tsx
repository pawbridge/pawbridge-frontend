import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { adminNavigation, currentAdminPath } from '../../lib/adminNavigation';
import { adminControl } from '../admin/AdminUI';

export default function AdminSidebar({ mobile = false, onNavigate }: { subdued?: boolean; mobile?: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const activePath = currentAdminPath(pathname);
  return <aside className={`flex flex-col bg-surface-light dark:bg-surface-dark ${mobile ? 'min-h-[calc(100dvh-7rem)] w-full' : 'h-full w-[240px] border-r border-brand-border p-4 dark:border-stone-700'}`}>
    {!mobile && <Link to="/admin/dashboard" className="mb-4"><span className="block text-xl font-bold">PawBridge</span><span className="mt-1 block text-xs text-brand-muted dark:text-stone-300">관리자 콘솔</span></Link>}
    <nav aria-label="관리자 메뉴" className={`min-h-0 flex-1 space-y-2 ${mobile ? '' : 'overflow-y-auto'}`}>
      {adminNavigation.map(group => <div key={group.label}><h2 className="px-2 py-2 text-xs font-medium text-brand-muted dark:text-stone-300">{group.label}</h2><div className="space-y-2">{group.items.map(item =>
        <Link key={item.path} to={item.path} onClick={onNavigate} aria-current={activePath === item.path ? 'page' : undefined} className={`flex min-h-11 items-center rounded-xl px-2 py-1 text-sm font-medium ${activePath === item.path ? 'bg-brand-soft dark:bg-stone-800' : 'hover:bg-stone-50 dark:hover:bg-stone-800'}`}><span className={`w-full rounded-full px-3 py-2 ${activePath === item.path ? 'bg-brand text-brand-ink' : ''}`}>{item.label}</span></Link>)}</div></div>)}
    </nav>
    <div className={`mt-6 flex flex-col gap-2 ${mobile ? 'pb-4' : 'text-sm'}`}>
      <Link className={mobile ? `${adminControl} min-h-12` : 'flex min-h-11 items-center'} to="/" onClick={onNavigate}>사용자 화면으로</Link>
      <button type="button" className={mobile ? `${adminControl} min-h-12` : 'min-h-11 text-left text-brand-muted dark:text-stone-300'} onClick={() => { logout(); onNavigate?.(); navigate('/login'); }}>로그아웃</button>
    </div>
  </aside>;
}
