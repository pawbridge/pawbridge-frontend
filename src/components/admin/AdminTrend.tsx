import { useState } from 'react';
import { groupAdminDays } from '../../lib/adminStatistics';
import type { AdminDailyCount } from '../../lib/adminStatistics';
import { adminPanel } from './AdminUI';

export default function AdminTrend({ title, rows, unit }: { title: string; rows: AdminDailyCount[]; unit: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const bars = groupAdminDays(rows);
  const max = Math.max(1, ...bars.map(bar => bar.count));
  const active = bars.find(bar => bar.date === selected);
  const format = (date: string) => date.slice(5).replace('-', '.');
  return <section className={`${adminPanel} space-y-4`}>
    <h2 className="text-xl font-bold">{title}</h2>
    <div className="flex flex-wrap justify-between gap-2 text-xs text-brand-muted dark:text-stone-300"><span>{rows[0]?.date}–{rows.at(-1)?.date}{rows.length > 14 ? ` · ${rows.length > 90 ? '30일' : '7일'} 단위 합계` : ''}</span><span className="text-sm text-brand-ink dark:text-white">총 {rows.reduce((sum, row) => sum + row.count, 0).toLocaleString()}{unit}</span></div>
    <div className="overflow-x-auto pb-2"><div className="flex h-48 items-end gap-2" style={{ minWidth: bars.length * 44 }}>
      {bars.map(bar => <button key={bar.date} type="button" className={`flex h-full min-w-11 flex-1 flex-col items-center justify-end gap-2 rounded-lg p-1 text-xs ${selected === bar.date ? 'bg-brand-soft dark:bg-stone-800' : ''}`} aria-pressed={selected === bar.date} aria-label={`${bar.date}${bar.date === bar.end ? '' : '부터 ' + bar.end + '까지'} ${bar.count}${unit}`} onClick={() => setSelected(bar.date)}>
        <span className="font-medium">{bar.count.toLocaleString()}{unit}</span>
        <span aria-hidden="true" className="w-3/4 max-w-24 bg-brand" style={{ height: bar.count / max * 128, minHeight: bar.count ? 2 : 0 }} />
        <span className="text-brand-muted dark:text-stone-300">{format(bar.date)}</span>
      </button>)}
    </div></div>
    <p className="min-h-6 text-xs text-brand-muted dark:text-stone-300" aria-live="polite">{active ? `${active.date}${active.date === active.end ? '' : '–' + active.end} · ${active.count.toLocaleString()}${unit}` : '막대를 선택하면 날짜별 수치를 확인할 수 있어요.'}</p>
  </section>;
}
