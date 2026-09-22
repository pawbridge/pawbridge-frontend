import { useEffect, useMemo, useState, type ReactNode } from 'react';

interface AnimalSearchPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function AnimalSearchPagination({ currentPage, totalPages, onPageChange }: AnimalSearchPaginationProps) {
  const [pageInput, setPageInput] = useState(String(currentPage + 1));
  useEffect(() => setPageInput(String(currentPage + 1)), [currentPage]);

  const pages = useMemo(() => {
    const values = new Set([0, totalPages - 1, currentPage - 1, currentPage, currentPage + 1]);
    return [...values].filter((page) => page >= 0 && page < totalPages).sort((a, b) => a - b);
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  const moveToInputPage = () => {
    const requested = Number(pageInput);
    if (!Number.isInteger(requested)) return;
    const nextPage = Math.min(Math.max(requested, 1), totalPages) - 1;
    setPageInput(String(nextPage + 1));
    onPageChange(nextPage);
  };

  return (
    <nav aria-label="검색 결과 페이지 이동" className="mt-8 flex flex-col items-center justify-center gap-4 border-t border-brand-border pt-6 lg:flex-row lg:border-0 lg:pt-0">
      <div className="flex items-center gap-1">
        <PageButton label="이전 페이지" disabled={currentPage === 0} onClick={() => onPageChange(currentPage - 1)}>‹</PageButton>
        {pages.map((page, index) => (
          <span key={page} className="contents">
            {index > 0 && page - pages[index - 1] > 1 && <span className="px-1 text-brand-muted dark:text-gray-300">…</span>}
            <PageButton active={page === currentPage} label={`${page + 1}페이지`} onClick={() => onPageChange(page)}>{page + 1}</PageButton>
          </span>
        ))}
        <PageButton label="다음 페이지" disabled={currentPage >= totalPages - 1} onClick={() => onPageChange(currentPage + 1)}>›</PageButton>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-brand-border text-xs text-brand-muted dark:text-gray-300 lg:ml-5 lg:border-l lg:pl-6">
        <label htmlFor="animal-page-input">페이지</label>
        <input id="animal-page-input" type="number" min="1" max={totalPages} inputMode="numeric" value={pageInput} onChange={(event) => setPageInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') moveToInputPage(); }} className="h-10 w-[72px] rounded-lg border border-brand-border bg-white dark:bg-card-dark px-2 text-center text-sm font-bold text-brand-ink dark:text-text-dark focus:border-brand-focus focus:outline-none focus:ring-2 focus:ring-brand-focus" />
        <span>/ {totalPages.toLocaleString()}</span>
        <button type="button" onClick={moveToInputPage} className="h-10 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink">이동</button>
        <span className="hidden xl:inline">원하는 페이지로 바로 이동</span>
      </div>
    </nav>
  );
}

function PageButton({ children, active = false, disabled = false, label, onClick }: { children: ReactNode; active?: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  return <button type="button" disabled={disabled} aria-label={label} aria-current={active ? 'page' : undefined} onClick={onClick} className={`flex size-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'border-brand-focus bg-brand font-bold text-brand-ink' : 'border-brand-border bg-white dark:bg-card-dark text-brand-muted dark:text-gray-300 hover:border-brand-focus hover:text-brand-accent'}`}>{children}</button>;
}
