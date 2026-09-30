import { useCallback, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

export type OpenMode = 'hover' | 'explicit' | null;
export interface NavigationDestination {
  to: string;
  title: string;
  description: string;
  current: (pathname: string) => boolean;
}

export function NavigationLinks({ id, destinations, mobile = false, onNavigate }: {
  id: string; destinations: NavigationDestination[]; mobile?: boolean; onNavigate: () => void;
}) {
  const { pathname } = useLocation();
  return destinations.map((item, index) => {
    const labelId = `${id}-${mobile ? 'mobile' : 'desktop'}-${index}`;
    const current = item.current(pathname);
    return <Link key={item.to} to={item.to} onClick={onNavigate}
      aria-current={current ? 'page' : undefined}
      aria-labelledby={`${labelId}-title`} aria-describedby={`${labelId}-description`}
      className={`flex min-w-0 flex-col gap-2 rounded-lg p-4 text-brand-ink hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-focus dark:text-white dark:hover:bg-gray-800 ${mobile ? 'py-3' : ''} ${current ? 'bg-brand-soft dark:bg-gray-800' : ''}`}>
      <span id={`${labelId}-title`} className={current ? 'text-sm font-bold leading-5' : mobile ? 'text-sm font-medium leading-5' : 'text-lg font-normal leading-[30px]'}>
        {item.title}{current && <span> · 현재 페이지</span>}
      </span>
      <span id={`${labelId}-description`} className={`text-brand-muted dark:text-gray-400 ${mobile ? 'text-xs leading-[18px]' : 'text-sm font-medium leading-5'}`}>{item.description}</span>
    </Link>;
  });
}

export default function NavigationGroup({ id, title, destinations, current, mode, anotherOpen, onModeChange }: {
  id: string; title: string; destinations: NavigationDestination[]; current: boolean; mode: OpenMode; anotherOpen: boolean;
  onModeChange: (id: string, next: OpenMode) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef(mode);
  const { pathname, search } = useLocation();
  const clearTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const changeMode = useCallback((next: OpenMode) => {
    clearTimer();
    modeRef.current = next;
    onModeChange(id, next);
  }, [clearTimer, id, onModeChange]);
  useEffect(() => { modeRef.current = mode; clearTimer(); }, [mode, clearTimer]);
  useEffect(() => { changeMode(null); }, [pathname, search, changeMode]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1280px)');
    const resize = () => { if (!desktop.matches) changeMode(null); };
    desktop.addEventListener('change', resize);
    return () => { desktop.removeEventListener('change', resize); clearTimer(); };
  }, [changeMode, clearTimer]);
  useEffect(() => {
    if (!mode) return;
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) changeMode(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      changeMode(null);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [mode, changeMode]);
  const scheduleClose = () => {
    clearTimer();
    if (modeRef.current === 'hover') timer.current = setTimeout(() => {
      if (!rootRef.current?.contains(document.activeElement)) changeMode(null);
    }, 300);
  };

  return <div ref={rootRef} className="flex h-16 items-center"
    onPointerEnter={(event) => {
      if (event.pointerType !== 'mouse') return;
      clearTimer();
      if (!modeRef.current) {
        // Crossing an adjacent trigger on the way to the open panel is not a menu switch.
        if (anotherOpen) timer.current = setTimeout(() => changeMode('hover'), 300);
        else changeMode('hover');
      }
    }} onPointerLeave={scheduleClose}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) changeMode(null); }}>
    <button ref={triggerRef} type="button" aria-expanded={!!mode} aria-controls={`${id}-animal-navigation`}
      aria-current={current ? 'page' : undefined}
      className={`rounded-lg px-3 py-2 text-sm leading-5 text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus ${current ? 'bg-brand font-bold hover:bg-brand-hover dark:text-brand-ink' : 'font-medium hover:bg-neutral-100 dark:text-gray-200 dark:hover:bg-gray-800'}`}
      onClick={() => changeMode(modeRef.current === 'explicit' ? null : 'explicit')}>{title}</button>
    {mode && <>
      <div aria-hidden="true" className="absolute inset-x-0 top-full z-40 h-[calc(100dvh-4rem)] bg-black/15" onPointerEnter={scheduleClose} onPointerDown={() => changeMode(null)} />
      <div id={`${id}-animal-navigation`} className="absolute inset-x-0 top-full z-50 border-b border-brand-border bg-white px-6 py-6 dark:border-border-dark dark:bg-background-dark" onPointerEnter={clearTimer}>
        <div className="mx-auto grid max-w-[960px] grid-cols-3 gap-6 2xl:max-w-[1096px] 2xl:gap-8">
          <NavigationLinks id={id} destinations={destinations} onNavigate={() => changeMode(null)} />
        </div>
      </div>
    </>}
  </div>;
}
