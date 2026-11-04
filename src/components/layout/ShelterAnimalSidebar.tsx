import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL } from '../../lib/contact';
import ExpandLessIcon from '../../assets/icons/material-symbols/expand_less.svg?react';
import HelpIcon from '../../assets/icons/material-symbols/help.svg?react';
import PersonIcon from '../../assets/icons/material-symbols/person.svg?react';
import PetsIcon from '../../assets/icons/material-symbols/pets.svg?react';

const menuLink = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-soft dark:hover:bg-stone-800 dark:hover:text-white transition-colors';
const subLink = 'block px-3 py-2 rounded-lg text-sm transition-colors';
const subLinkIdle = 'text-brand-muted hover:text-brand-ink hover:bg-brand-soft dark:hover:text-white dark:hover:bg-stone-800';
const subLinkActive = 'font-bold text-brand-accent bg-brand/10';

// 보호소 회원의 동물 등록, 수정 화면 사이드바. 관리자 콘솔 메뉴는 보호소 회원이 들어갈 수 없어 따로 둔다.
// current: 지금 화면이 속한 하위 메뉴 (수정은 등록한 동물 목록에서 들어오므로 'registered')
export default function ShelterAnimalSidebar({ current }: { current: 'registered' | 'create' }) {
  return (
    <aside className="hidden md:flex w-64 bg-surface-light dark:bg-surface-dark border-r border-brand-border dark:border-stone-800 flex-col flex-shrink-0 z-50">
      <Link to="/" className="h-16 flex items-center gap-3 px-6 border-b border-brand-border dark:border-stone-800">
        <img src="/favicon.svg" alt="" aria-hidden="true" width={32} height={32} className="size-8 shrink-0" />
        <span className="text-xl font-display font-bold tracking-tight text-brand-ink dark:text-white">PawBridge</span>
      </Link>

      <nav aria-label="보호소 동물 관리" className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1 scrollbar-hide">
        <Link to="/mypage" className={menuLink}>
          <PersonIcon aria-hidden="true" className="icon text-[22px]" />
          <span className="text-sm font-medium">마이페이지</span>
        </Link>
        <div className="my-2 h-px bg-brand-border dark:bg-stone-800 mx-3"></div>
        <Link to="/animals" className={menuLink}>
          <PetsIcon aria-hidden="true" className="icon text-[22px]" />
          <span className="text-sm font-medium">동물 목록</span>
        </Link>
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-brand-ink dark:text-white bg-brand-soft dark:border dark:border-accent-border-dark font-bold">
            <div className="flex items-center gap-3">
              <PetsIcon aria-hidden="true" className="icon text-[22px] text-brand-accent" />
              <span className="text-sm">동물 관리</span>
            </div>
            <ExpandLessIcon aria-hidden="true" className="icon text-[18px]" />
          </div>
          <div className="flex flex-col pl-11 gap-1">
            <Link
              to="/mypage"
              state={{ tab: 'registeredAnimals' }}
              aria-current={current === 'registered' ? 'page' : undefined}
              className={`${subLink} ${current === 'registered' ? subLinkActive : subLinkIdle}`}
            >
              내 보호소가 등록한 동물
            </Link>
            <Link
              to="/animals/new"
              aria-current={current === 'create' ? 'page' : undefined}
              className={`${subLink} ${current === 'create' ? subLinkActive : subLinkIdle}`}
            >
              동물 등록
            </Link>
          </div>
        </div>
      </nav>

      {/* 고객지원: 푸터와 같은 문의 메일로 연결 */}
      <div className="p-4 border-t border-brand-border dark:border-stone-800">
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-brand-muted hover:text-brand-ink dark:hover:text-white bg-transparent hover:bg-brand-soft dark:hover:bg-stone-800 rounded-lg transition-colors"
        >
          <HelpIcon aria-hidden="true" className="icon text-[18px]" />
          고객지원
        </a>
      </div>
    </aside>
  );
}
