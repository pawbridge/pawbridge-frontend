import type { ReactNode } from 'react';

// SHYU 디자인 시스템 Inline Alert(Tone=Warning)와 같은 모양이다. 색은 SHYU color/bg/warning,
// color/text/warning과 같은 Tailwind amber 단계(라이트 50/700, 다크 950/50)를 쓴다.
export default function InlineAlert({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return <div role="note" className={`flex gap-3 rounded-xl bg-amber-50 p-4 text-amber-700 dark:bg-amber-950 dark:text-amber-50 ${className}`}>
    <span aria-hidden="true" className="w-1 shrink-0 rounded-full bg-current" />
    <div className="min-w-0">
      <p className="text-xl font-bold leading-7">{title}</p>
      <p className="mt-1 text-sm leading-6">{children}</p>
    </div>
  </div>;
}
