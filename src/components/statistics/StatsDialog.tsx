import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export default function StatsDialog({ title, onClose, children, busy = false, compact = false, fullScreen = false, closeIcon, headingClassName = 'text-xl', wrapFocus = false }: { title: string; onClose: () => void; children: ReactNode; busy?: boolean; compact?: boolean; fullScreen?: boolean; closeIcon?: string; headingClassName?: string; wrapFocus?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = returnFocus.current;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = overflow; previousFocus?.focus({ preventScroll: true }); };
  }, []);
  return (
    <dialog ref={ref} aria-label={title} aria-busy={busy || undefined} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
      onKeyDown={event => {
        if (!wrapFocus || event.key !== 'Tab') return;
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),iframe,[tabindex="0"]')].filter(node => node.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      style={{ width: fullScreen ? '100%' : 'calc(100% - 2rem)', margin: fullScreen ? 0 : 'auto', ...(fullScreen ? { position: 'fixed', inset: 0 } : {}) }}
      className={`${fullScreen ? 'm-0 h-dvh max-h-dvh max-w-none border-0' : `max-h-[calc(100dvh-2rem)] ${compact ? 'max-w-xl rounded-2xl' : 'max-w-5xl rounded-xl'} border`} overflow-y-auto ${compact || fullScreen ? 'border-brand-border backdrop:bg-black/25' : 'border-border-light backdrop:bg-black/50'} bg-card-light p-0 text-text-light shadow-xl dark:border-border-dark dark:bg-card-dark dark:text-text-dark`}>
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className={`min-w-0 break-words font-bold ${headingClassName}`}>{title}</h2>
          <button autoFocus type="button" aria-label="닫기" disabled={busy} onClick={onClose} className={`${closeIcon ? 'flex size-11 shrink-0 items-center justify-center rounded-full' : `min-h-11 border ${compact || fullScreen ? 'rounded-2xl border-brand-border font-medium' : 'rounded-lg border-border-light font-semibold'} px-4 text-sm`} disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus dark:border-border-dark`}>{closeIcon ? <img src={closeIcon} width="24" height="24" alt="" /> : '닫기'}</button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
