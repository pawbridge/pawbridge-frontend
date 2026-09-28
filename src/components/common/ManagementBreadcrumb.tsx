import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

type ManagementBreadcrumbProps = {
  current: string;
};

const ancestors = [
  { label: '홈', to: '/', state: undefined },
  { label: '마이페이지', to: '/mypage', state: undefined },
  { label: '등록한 동물', to: '/mypage', state: { tab: 'registeredAnimals' } },
] as const;

export default function ManagementBreadcrumb({ current }: ManagementBreadcrumbProps) {
  const [expanded, setExpanded] = useState(false);
  const menuRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!expanded) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false);
        menuRef.current?.querySelector('button')?.focus();
      }
    };
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setExpanded(false);
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOutside);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOutside);
    };
  }, [expanded]);

  const separator = (
    <span aria-hidden="true" className="material-symbols-outlined text-base leading-none text-brand-muted">
      chevron_right
    </span>
  );

  return (
    <nav aria-label="현재 위치" className="relative min-w-0 text-sm font-medium">
      <ol className="hidden h-11 items-center gap-1.5 md:flex">
        {ancestors.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <Link
              to={item.to}
              state={item.state}
              className="rounded-md px-1.5 py-2 text-brand-muted transition-colors hover:bg-brand-soft hover:text-brand-ink dark:hover:bg-stone-800 dark:hover:text-white"
            >
              {item.label}
            </Link>
            {separator}
          </li>
        ))}
        <li aria-current="page" className="max-w-56 truncate rounded-lg bg-brand-soft px-3 py-2 font-bold text-brand-ink dark:bg-stone-800 dark:text-white">
          {current}
        </li>
      </ol>

      <ol className="flex h-11 min-w-0 items-center gap-1 md:hidden">
        <li>
          <Link to="/" className="inline-flex min-h-11 items-center rounded-md px-1.5 text-brand-muted hover:text-brand-ink dark:hover:text-white">
            홈
          </Link>
        </li>
        <li>{separator}</li>
        <li ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="상위 경로 보기"
            aria-expanded={expanded}
            aria-controls={expanded ? 'management-breadcrumb-ancestors' : undefined}
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-brand-muted hover:bg-brand-soft hover:text-brand-ink dark:hover:bg-stone-800 dark:hover:text-white"
          >
            <span aria-hidden="true">…</span>
          </button>
          {expanded && (
            <div
              id="management-breadcrumb-ancestors"
              className="absolute left-0 top-full z-30 mt-1 w-44 rounded-xl border border-brand-border bg-white p-1.5 shadow-lg dark:border-stone-700 dark:bg-stone-900"
            >
              {ancestors.slice(1).map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  state={item.state}
                  onClick={() => setExpanded(false)}
                  className="block rounded-lg px-3 py-2.5 text-brand-ink hover:bg-brand-soft dark:text-white dark:hover:bg-stone-800"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </li>
        <li>{separator}</li>
        <li aria-current="page" className="min-w-0 max-w-[calc(100vw-172px)] truncate rounded-lg bg-brand-soft px-3 py-2 font-bold text-brand-ink dark:bg-stone-800 dark:text-white">
          {current}
        </li>
      </ol>
    </nav>
  );
}
