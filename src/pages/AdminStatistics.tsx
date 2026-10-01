import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDailySignupStats, getDailyAnimalStats } from '../api/stats.api';
import AdminLayout from '../components/layout/AdminLayout';
import AdminTrend from '../components/admin/AdminTrend';
import { AdminError, AdminLoading, AdminPagination, adminControl, adminInput, adminPanel, adminPrimary } from '../components/admin/AdminUI';
import { adminDailyChange, fillAdminDays, kstToday, shiftDay, validAdminRange } from '../lib/adminStatistics';

export default function AdminStatistics() {
  const today = kstToday();
  const [tab, setTab] = useState<'signup' | 'collection'>('signup');
  const [range, setRange] = useState({ start: shiftDay(today, -6), end: today });
  const [draft, setDraft] = useState(range);
  const [rangeError, setRangeError] = useState('');
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ['admin-statistics', tab, range.start, range.end],
    queryFn: () => (tab === 'signup' ? getDailySignupStats : getDailyAnimalStats)(shiftDay(range.start, -1), range.end),
  });
  const rows = query.isSuccess ? fillAdminDays(query.data, range.start, range.end) : [];
  const previous = new Map((query.data || []).map(row => [row.date.slice(0, 10), row.count]));
  const change = (date: string, count: number) => adminDailyChange(count, previous.get(shiftDay(date, -1)) ?? 0);
  const unit = tab === 'signup' ? '명' : '건';
  const label = tab === 'signup' ? '회원 가입' : '동물 신규 수집';
  const apply = (next: typeof range) => {
    if (!validAdminRange(next.start, next.end) || next.end > today) { setRangeError('시작일과 종료일을 확인해 주세요. 오늘까지 최대 366일을 조회할 수 있습니다.'); return; }
    setRange(next); setDraft(next); setPage(0); setRangeError('');
  };
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return <AdminLayout title="통계" description="집계 기준을 구분하여 회원 가입과 수집 현황을 확인하세요.">
    <section className={`${adminPanel} space-y-5`}>
      <div role="group" aria-label="통계 유형" className="flex flex-wrap gap-2">
        <button className={tab === 'signup' ? adminPrimary : adminControl} aria-pressed={tab === 'signup'} onClick={() => { setTab('signup'); setPage(0); }}>회원</button>
        <button className={tab === 'collection' ? adminPrimary : adminControl} aria-pressed={tab === 'collection'} onClick={() => { setTab('collection'); setPage(0); }}>동물 수집</button>
      </div>
      <form className="flex flex-col items-end gap-4 sm:flex-row" onSubmit={event => { event.preventDefault(); apply(draft); }}>
        <label htmlFor="stats-start" className="w-full text-sm font-medium">시작일<input id="stats-start" type="date" max={today} className={adminInput} value={draft.start} onChange={event => setDraft({ ...draft, start: event.target.value })} /></label>
        <label htmlFor="stats-end" className="w-full text-sm font-medium">종료일<input id="stats-end" type="date" max={today} className={adminInput} value={draft.end} onChange={event => setDraft({ ...draft, end: event.target.value })} /></label>
        <button className={`${adminPrimary} w-full shrink-0 sm:w-auto`}>조회</button>
      </form>
      {rangeError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{rangeError}</p>}
      <div role="group" aria-label="조회 기간" className="flex flex-wrap gap-2">{[['오늘', today], ['최근 7일', shiftDay(today, -6)], ['최근 30일', shiftDay(today, -29)], ['이번 달', today.slice(0, 8) + '01']].map(([text, start]) => <button key={text} className={range.start === start && range.end === today ? adminPrimary : adminControl} aria-pressed={range.start === start && range.end === today} onClick={() => apply({ start, end: today })}>{text}</button>)}</div>
      <p className="text-xs text-brand-muted dark:text-stone-300">{tab === 'signup' ? '가입일 기준 · 현재 남아 있는 회원 기록입니다. 회원 삭제가 과거 집계에 영향을 줄 수 있습니다.' : '시스템 최초 저장일 기준 · 실제 발견·접수 건수가 아닙니다. 수동 등록과 공공 데이터 수집이 포함될 수 있습니다.'}</p>
    </section>
    {query.isPending ? <AdminLoading label="통계를 불러오는 중입니다." /> : query.isError ? <AdminError title="통계 조회 실패" retry={() => void query.refetch()} /> : <>
      <div className="grid gap-4 sm:grid-cols-3">{[['기간 합계', `${total.toLocaleString()}${unit}`], ['하루 최대', `${Math.max(0, ...rows.map(row => row.count)).toLocaleString()}${unit}`], ['일평균', `${(total / Math.max(1, rows.length)).toFixed(1)}${unit}`]].map(([name, value]) => <section key={name} className={`${adminPanel} space-y-3`}><h2 className="text-sm text-brand-muted dark:text-stone-300">{name}</h2><p className="text-[28px] font-bold">{value}</p></section>)}</div>
      <AdminTrend key={`${tab}-${range.start}-${range.end}`} title={`${label} 추이`} rows={rows} unit={unit} />
      <section className={`${adminPanel} space-y-5`}>
        <h2 className="text-xl font-bold">날짜별 상세</h2><p className="text-xs text-brand-muted dark:text-stone-300">달력상의 전일과 비교합니다. 전일 0건에서 증가하면 증감 건수를 표시합니다.</p>
        <div className="space-y-3">{[...rows].reverse().slice(page * 7, (page + 1) * 7).map(row => <div key={row.date} className={`grid gap-3 rounded-lg border border-brand-border p-4 sm:grid-cols-3 dark:border-stone-700 ${row.date === today ? 'bg-brand-soft dark:bg-stone-800' : ''}`}><span className="text-sm font-medium">{row.date}{row.date === today ? ' · 오늘' : ''}</span><span className="text-sm">{row.count.toLocaleString()}{unit}</span><span className="text-xs text-brand-muted dark:text-stone-300">전일 대비 {change(row.date, row.count)}</span></div>)}</div>
        <AdminPagination page={page} total={Math.ceil(rows.length / 7)} onChange={setPage} />
      </section>
    </>}
  </AdminLayout>;
}
