import type { ReactNode } from 'react';
import { useState } from 'react';

// PawBridge / SHYU: shared Yellow theme, 4px spacing and 16px panels.
export const adminPanel = 'min-w-0 rounded-xl border border-brand-border bg-surface-light p-4 sm:p-6 dark:border-stone-700 dark:bg-surface-dark';
export const adminControl = 'inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-border bg-surface-light px-5 py-3 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-surface-dark dark:text-white';
export const adminPrimary = `${adminControl} !border-transparent !bg-brand !text-brand-ink hover:!bg-brand-hover`;
export const adminInput = 'mt-2 min-h-12 w-full min-w-0 rounded-lg border border-brand-border bg-surface-light px-4 py-3 text-sm text-brand-ink focus:border-brand-focus focus:ring-brand-focus disabled:opacity-50 dark:border-stone-700 dark:bg-surface-dark dark:text-white';

export function AdminImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failedSource, setFailedSource] = useState<string>();
  return failedSource === src ? <div role="img" aria-label={alt + ' · 이미지를 불러오지 못했습니다.'} className={`${className} flex items-center justify-center bg-stone-100 p-2 text-center text-xs text-brand-muted`}>이미지를 불러오지 못했습니다.</div> : <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailedSource(src)} />;
}

export function AdminLoading({ label = '정보를 불러오는 중입니다.' }: { label?: string }) {
  return <section role="status" aria-label={label} className={`${adminPanel} space-y-4`}>
    <p className="text-sm text-brand-muted dark:text-stone-300">{label}</p>
    {[0, 1, 2].map(item => <div key={item} aria-hidden="true" className="h-12 rounded-lg bg-stone-100 motion-safe:animate-pulse dark:bg-stone-800" />)}
  </section>;
}

export function AdminError({ title = '정보를 불러오지 못했습니다.', retry, children }: { title?: string; retry?: () => void; children?: ReactNode }) {
  return <section role="alert" className={`${adminPanel} space-y-4`}>
    <h2 className="text-lg font-bold">{title}</h2>
    <p className="text-sm text-brand-muted dark:text-stone-300">잠시 후 다시 시도해 주세요. 조회 실패는 0건을 의미하지 않습니다.</p>
    {children}
    {retry && <button type="button" className={adminControl} onClick={retry}>다시 불러오기</button>}
  </section>;
}

export function AdminEmpty({ title, children }: { title: string; children?: ReactNode }) {
  return <section className={`${adminPanel} space-y-4`}><h2 className="text-lg font-bold">{title}</h2>{children}</section>;
}

export function AdminPagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  return <nav aria-label="페이지 이동" className="flex flex-wrap items-center justify-center gap-3">
    <button type="button" className={adminControl} disabled={page <= 0} onClick={() => onChange(page - 1)}>이전</button>
    <span className="text-sm" aria-live="polite">{Math.min(page + 1, Math.max(total, 1))} / {Math.max(total, 1)}</span>
    <button type="button" className={adminControl} disabled={page + 1 >= total} onClick={() => onChange(page + 1)}>다음</button>
  </nav>;
}

export function AdminRecord({ title, description, meta, status, children }: { title: ReactNode; description?: ReactNode; meta?: ReactNode; status?: ReactNode; children: ReactNode }) {
  return <li className={`${adminPanel} !p-3 space-y-3`}>
    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:justify-between">
      <div className="min-w-0 space-y-3 break-words">
        <div className="text-sm font-medium">{title}</div>
        {description && <div className="break-all text-xs text-brand-muted dark:text-stone-300">{description}</div>}
        {meta && <div className="text-xs text-brand-muted dark:text-stone-300">{meta}</div>}
      </div>
      {status && <div className="shrink-0">{status}</div>}
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </li>;
}

export function AdminDetailFields({ fields }: { fields: [string, ReactNode][] }) {
  return <dl className="grid min-w-0 gap-4 sm:grid-cols-2">{fields.map(([label, value]) =>
    <div key={label} className="min-w-0 rounded-lg bg-stone-50 p-4 dark:bg-stone-800">
      <dt className="text-xs text-brand-muted dark:text-stone-300">{label}</dt>
      <dd className="mt-2 break-words text-sm [overflow-wrap:anywhere]">{value || '등록 정보 없음'}</dd>
    </div>)}</dl>;
}
