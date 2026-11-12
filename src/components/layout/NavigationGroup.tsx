import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
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
      className={`flex min-w-0 flex-col gap-2 rounded-lg p-4 text-brand-ink hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-focus dark:text-white dark:hover:bg-gray-800 ${mobile ? 'py-3' : ''} ${current ? 'bg-brand-soft dark:border dark:border-accent-border-dark' : ''}`}>
      <span id={`${labelId}-title`} className={current ? 'text-sm font-bold leading-5' : mobile ? 'text-sm font-medium leading-5' : 'text-lg font-normal leading-[30px]'}>
        {item.title}
      </span>
      <span id={`${labelId}-description`} className={`text-brand-muted dark:text-gray-400 ${mobile ? 'text-xs leading-[18px]' : 'text-sm font-medium leading-5'}`}>{item.description}</span>
    </Link>;
  });
}

export default function NavigationGroup({ id, title, destinations, current, mode, canOpenOnHover, onModeChange }: {
  id: string; title: string; destinations: NavigationDestination[]; current: boolean; mode: OpenMode;
  canOpenOnHover: (x: number, y: number) => boolean;
  onModeChange: (id: string, next: OpenMode) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aimWatch = useRef<((event: PointerEvent) => void) | null>(null);
  const modeRef = useRef(mode);
  const { pathname, search } = useLocation();
  const clearTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    if (aimWatch.current) document.removeEventListener('pointermove', aimWatch.current);
    aimWatch.current = null;
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
  const scheduleClose = (event: ReactPointerEvent) => {
    clearTimer();
    if (modeRef.current !== 'hover') return;
    // 버튼에 남은 포커스는 닫기를 막지 않는다. 패널 링크에 포커스가 있을 때만 남겨 포커스를 잃지 않게 한다.
    const close = () => {
      if (!document.getElementById(`${id}-animal-navigation`)?.contains(document.activeElement)) changeMode(null);
    };
    // 바로 닫되, 패널로 비스듬히 내려가며 옆 칸을 지나는 동안만 짧게 기다린다.
    if (canOpenOnHover(event.clientX, event.clientY)) {
      close();
      return;
    }
    timer.current = setTimeout(close, 150);
    // 벗어난 지점보다 위로 가거나, 내려간 거리에 비해 옆으로 너무 멀리 가면 옆으로 벗어난 것으로 보고 바로 닫는다.
    // 가장 먼 링크로 가는 길도 기울기가 0.15 안팎이라 기울기 0.1(10배)까지는 내려가는 중으로 본다.
    const start = { x: event.clientX, y: event.clientY };
    aimWatch.current = move => {
      const down = move.clientY - start.y;
      if (down < 0 || Math.abs(move.clientX - start.x) > down * 10 + 16) close();
    };
    document.addEventListener('pointermove', aimWatch.current);
  };

  const hoverTrigger = (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== 'mouse') return;
      clearTimer();
      if (!modeRef.current && canOpenOnHover(event.clientX, event.clientY)) {
        // 메뉴 선택은 즉시 반영하고, 패널로 이동할 때의 닫기만 짧게 유예한다.
        changeMode('hover');
      }
  };

  return <div ref={rootRef} className="flex h-16 items-center"
    onPointerEnter={clearTimer} onPointerLeave={scheduleClose}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) changeMode(null); }}>
    <button ref={triggerRef} type="button" aria-expanded={!!mode} aria-controls={`${id}-animal-navigation`}
      onPointerEnter={hoverTrigger}
      onPointerMove={hoverTrigger}
      aria-current={current ? 'page' : undefined}
      className={`rounded-lg px-3 py-2 text-sm leading-5 text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus ${current ? 'bg-brand font-bold hover:bg-brand-hover dark:text-brand-ink' : 'font-medium hover:bg-neutral-100 dark:text-gray-200 dark:hover:bg-gray-800'}`}
      onClick={() => {
        // 호버로 열린 메뉴는 클릭해도 고정하지 않는다. 클릭 열고 닫기는 호버가 없는 터치와 키보드용이다.
        if (modeRef.current !== 'hover') changeMode(modeRef.current ? null : 'explicit');
      }}>{title}</button>
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
