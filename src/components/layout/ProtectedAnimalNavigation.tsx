import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const destinations = [
  { to: '/animals', title: '보호동물 검색', description: '보호 중인 동물을 조건별로 찾아보세요' },
  { to: '/shelters', title: '보호소 찾기', description: '지역별 보호소 정보를 확인하세요' },
  { to: '/animals/stats', title: '유기동물 현황', description: '전국 구조·보호·입양 현황을 살펴보세요' },
];

export function ProtectedAnimalLinks({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate: () => void }) {
  return destinations.map((item, index) => {
    const id = `protected-${mobile ? 'mobile' : 'desktop'}-${index}`;
    return (
      <NavLink key={item.to} to={item.to} end onClick={onNavigate}
        aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
        className={({ isActive }) => `flex min-w-0 flex-col gap-2 whitespace-normal p-4 text-brand-ink hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-focus dark:text-white dark:hover:bg-gray-800 ${mobile ? 'py-3' : ''} ${isActive ? 'bg-brand-soft dark:bg-gray-800' : ''}`}
      >
        <span id={`${id}-title`} className={mobile ? 'text-sm font-medium leading-5' : 'text-lg font-normal leading-[30px]'}>{item.title}</span>
        <span id={`${id}-description`} className={`text-brand-muted dark:text-gray-400 ${mobile ? 'text-xs leading-[18px]' : 'text-sm font-medium leading-5'}`}>{item.description}</span>
      </NavLink>
    );
  });
}

type OpenMode = 'hover' | 'explicit' | null;

export default function ProtectedAnimalNavigation() {
  const [mode, setMode] = useState<OpenMode>(null);
  const modeRef = useRef<OpenMode>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { pathname } = useLocation();
  const clearTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const changeMode = useCallback((next: OpenMode) => {
    clearTimer();
    modeRef.current = next;
    setMode(next);
  }, [clearTimer]);

  useEffect(() => {
    changeMode(null);
  }, [pathname, changeMode]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1280px)');
    const onResize = () => { if (!desktop.matches) changeMode(null); };
    desktop.addEventListener('change', onResize);
    return () => { desktop.removeEventListener('change', onResize); clearTimer(); };
  }, [changeMode, clearTimer]);

  useEffect(() => {
    if (!mode) return;
    const onOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) changeMode(null);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      changeMode(null);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [mode, changeMode]);

  return (
    <div ref={rootRef} className="flex h-16 items-center"
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return;
        clearTimer();
        if (!modeRef.current) changeMode('hover');
      }}
      onPointerLeave={() => {
        clearTimer();
        // Explicit activation stays open until dismissed; hovering is only an enhancement.
        if (modeRef.current === 'hover') timer.current = setTimeout(() => {
          if (!rootRef.current?.contains(document.activeElement)) changeMode(null);
        }, 300);
      }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) changeMode(null); }}
    >
      <button ref={triggerRef} type="button" aria-expanded={!!mode} aria-controls="protected-animal-navigation"
        className="relative flex h-16 items-center px-3 text-sm font-medium text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-focus dark:text-gray-200"
        onClick={() => changeMode(modeRef.current === 'explicit' ? null : 'explicit')}
      >
        보호동물
        {mode && <span aria-hidden="true" className="absolute bottom-0 left-3 right-3 h-[3px] bg-brand-ink dark:bg-gray-200" />}
      </button>
      {mode && <>
        <div aria-hidden="true" className="absolute left-0 top-full z-40 h-[calc(100dvh-4rem)] w-full bg-black/15"
          onPointerEnter={() => {
            clearTimer();
            if (modeRef.current === 'hover') timer.current = setTimeout(() => {
              if (!rootRef.current?.contains(document.activeElement)) changeMode(null);
            }, 300);
          }}
          onPointerDown={() => changeMode(null)} />
        <div id="protected-animal-navigation" className="absolute inset-x-0 top-full z-50 border-b border-brand-border bg-white px-6 py-6 dark:border-border-dark dark:bg-background-dark"
          onPointerEnter={clearTimer}>
          <div className="mx-auto grid max-w-[960px] grid-cols-3 gap-6 2xl:max-w-[1096px] 2xl:gap-8">
            <ProtectedAnimalLinks onNavigate={() => changeMode(null)} />
          </div>
        </div>
      </>}
    </div>
  );
}
