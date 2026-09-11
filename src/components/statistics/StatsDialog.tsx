import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export default function StatsDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
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
    <dialog ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}
      style={{ width: 'calc(100% - 2rem)' }}
      className="max-h-[calc(100dvh-2rem)] max-w-5xl rounded-xl border border-border-light bg-card-light p-0 text-text-light shadow-xl backdrop:bg-black/50 dark:border-border-dark dark:bg-card-dark dark:text-text-dark">
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button autoFocus type="button" onClick={onClose} className="min-h-11 rounded-lg border border-border-light px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-border-dark">닫기</button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
