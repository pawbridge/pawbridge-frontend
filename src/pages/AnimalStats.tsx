import { outcomeRates } from '../utils/animalStatistics';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTodayAnimalStats, getAnimalStatusStats, getRegionalAnimalStats } from '../api/animalStats.api';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import RegionalAnimalStats from '../components/statistics/RegionalAnimalStats';
import StatsDialog from '../components/statistics/StatsDialog';
import { kstToday, periodStart, validateDateRange } from '../components/statistics/regionalStats';

const control = 'min-h-11 rounded-lg border border-border-light px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-border-dark';

function QueryError({ retry }: { retry: () => void }) {
  return <div role="alert" className="rounded-xl border border-border-light p-5 dark:border-border-dark"><p>현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p><button type="button" onClick={retry} className={`${control} mt-3`}>다시 시도</button></div>;
}

export default function AnimalStats() {
  const today = kstToday();
  const [period, setPeriod] = useState<number | 'custom'>(1);
  const [range, setRange] = useState({ start: today, end: today });
  const [editingDates, setEditingDates] = useState(false);
  const [draft, setDraft] = useState(range);
  const [dateError, setDateError] = useState('');
  const startDate = period === 'custom' ? range.start : periodStart(today, period);
  const endDate = period === 'custom' ? range.end : today;

  const todayQuery = useQuery({ queryKey: ['today-animal-stats', today], queryFn: getTodayAnimalStats, retry: 1 });
  const recentStart = periodStart(today, 30);
  const recentQuery = useQuery({ queryKey: ['animal-status-stats', recentStart, today], queryFn: () => getAnimalStatusStats(recentStart, today), retry: 1 });
  const rates = outcomeRates(recentQuery.data);
  const statusQuery = useQuery({ queryKey: ['animal-status-stats', startDate, endDate], queryFn: () => getAnimalStatusStats(startDate, endDate), retry: 1 });
  const regionalQuery = useQuery({ queryKey: ['animal-regional-stats', startDate, endDate], queryFn: () => getRegionalAnimalStats(startDate, endDate), retry: 1 });
  const statusStats = statusQuery.data ?? [];
  const statusMax = Math.max(1, ...statusStats.map(s => s.count));
  const regionalTotal = regionalQuery.data?.reduce((sum, row) => sum + row.count, 0);
  const todayCards = [
    { label: '오늘 구조', value: todayQuery.data?.rescuedToday, unit: '마리', loading: todayQuery.isPending, failed: todayQuery.isError },
    { label: '입양률 (최근 30일 구조)', value: rates?.adoptionRate, unit: '%', loading: recentQuery.isPending, failed: recentQuery.isError },
    { label: '안락사율 (최근 30일 구조)', value: rates?.euthanasiaRate, unit: '%', loading: recentQuery.isPending, failed: recentQuery.isError },
  ];

  return <div className="flex min-h-screen flex-col bg-background-light text-text-light dark:bg-background-dark dark:text-text-dark">
    <Header />
    <main className="container mx-auto flex-1 px-4 py-8 md:py-12">
      <nav aria-label="현재 위치" className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><Link to="/" className="py-2 hover:underline">홈</Link><span aria-hidden="true">/</span><span aria-current="page">유기동물 현황</span></nav>
      <h1 className="text-3xl font-black tracking-tight md:text-4xl">유기동물 현황</h1>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">지역별 현황을 살펴보고, 우리 지역의 동물들에게 관심을 보내주세요.</p>

      <section aria-labelledby="today-heading" className="mt-8">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><h2 id="today-heading" className="text-lg font-bold">전국 구조·보호 현황</h2><span className="text-xs text-gray-600 dark:text-gray-300">{today} · 한국 시간 기준</span></div>
        <div className="grid grid-cols-3 divide-x divide-border-light overflow-hidden rounded-xl border border-border-light bg-card-light dark:divide-border-dark dark:border-border-dark dark:bg-card-dark">
          {todayCards.map(card => <div key={card.label} className="px-2 py-5 text-center sm:p-6"><p className="text-xs text-gray-600 sm:text-sm dark:text-gray-300">{card.label}</p><p className="mt-2 text-xl font-bold sm:text-3xl">{card.failed ? <span className="text-xs">조회 실패</span> : card.loading ? <span aria-label="불러오는 중">—</span> : <>{card.value?.toLocaleString() ?? '—'}<span className="ml-1 text-xs font-normal sm:text-sm">{card.unit}</span></>}</p></div>)}
        </div>
        {(todayQuery.isError || recentQuery.isError) && <button type="button" className={`${control} mt-3`} onClick={() => { void todayQuery.refetch(); void recentQuery.refetch(); }}>오늘 현황 다시 시도</button>}
        <p className="mt-3 text-xs text-gray-600 dark:text-gray-300">비율은 최근 30일({recentStart} ~ {today}) 구조 동물 전체 중 현재 입양·안락사 상태의 비율입니다. 보호 중인 동물도 분모에 포함하며, 이후 상태 변경에 따라 달라집니다.</p>
      </section>

      <section aria-labelledby="period-heading" className="my-8 rounded-xl border border-border-light p-4 sm:p-5 dark:border-border-dark">
        <h2 id="period-heading" className="mb-3 text-sm font-bold">조회 기간</h2>
        <div className="flex flex-wrap gap-2">
          {[{ days: 1, label: '오늘' }, { days: 7, label: '7일' }, { days: 30, label: '30일' }].map(item => <button type="button" key={item.days} aria-pressed={period === item.days} onClick={() => setPeriod(item.days)} className={`${control} ${period === item.days ? 'border-primary bg-primary text-primary-content' : 'hover:bg-primary/10'}`}>{item.label}</button>)}
          <button type="button" aria-pressed={period === 'custom'} onClick={() => { setDraft({ start: startDate, end: endDate }); setDateError(''); setEditingDates(true); }} className={`${control} ${period === 'custom' ? 'border-primary bg-primary text-primary-content' : 'hover:bg-primary/10'}`}>직접 선택</button>
        </div>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300" aria-live="polite">{startDate} ~ {endDate}</p>
      </section>

      <section aria-labelledby="status-heading">
        <h2 id="status-heading" className="text-2xl font-bold">전국 상태별 현황</h2>
        <p className="mb-5 mt-2 text-sm text-gray-600 dark:text-gray-300">선택 기간에 구조된 동물의 현재 상태입니다. 구조일은 APMS 접수일 기준이며, 상태는 마지막 동기화 결과입니다. 해당 기간에 입양·안락사가 발생한 건수를 뜻하지 않습니다.</p>
        {statusQuery.isPending ? <p role="status">전국 상태별 현황을 불러오는 중입니다.</p> : statusQuery.isError ? <QueryError retry={() => { void statusQuery.refetch(); }} /> : <div className="space-y-5 rounded-xl border border-border-light p-5 dark:border-border-dark">
          {statusStats.length === 0 ? <p>선택 기간에 구조된 동물이 없습니다.</p> : statusStats.map(item => <div key={item.status}><div className="mb-2 flex justify-between gap-3 text-sm"><span>{item.label}</span><strong>{item.count.toLocaleString()}마리</strong></div><div aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-full rounded-full bg-primary" style={{ width: `${item.count / statusMax * 100}%` }} /></div></div>)}
        </div>}
      </section>

      <section aria-labelledby="regional-heading" className="mt-10">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3"><div><h2 id="regional-heading" className="text-2xl font-bold">지역별 구조 현황</h2><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">보호소 소재지 · 구조일(APMS 접수일) 기준 · 소재지가 확인된 동물 집계</p></div>{regionalQuery.isSuccess && <p className="text-sm">전국 <strong className="text-xl">{regionalTotal?.toLocaleString()}</strong>마리</p>}</div>
        {regionalQuery.isPending ? <p role="status" className="rounded-xl bg-primary/5 p-8 text-center">지역별 현황을 불러오는 중입니다.</p> : regionalQuery.isError ? <QueryError retry={() => { void regionalQuery.refetch(); }} /> : <>
          {regionalTotal === 0 && <p role="status" className="mb-4 rounded-lg bg-primary/10 p-4 text-sm">선택한 기간에 집계된 구조 동물이 없습니다.</p>}
          <RegionalAnimalStats key={`${startDate}:${endDate}`} data={regionalQuery.data} />
        </>}
      </section>
    </main>
    <Footer />
    {editingDates && <StatsDialog title="조회 기간 선택" onClose={() => setEditingDates(false)}>
      <form noValidate onSubmit={event => { event.preventDefault(); const error = validateDateRange(draft.start, draft.end, today); setDateError(error); if (!error) { setRange(draft); setPeriod('custom'); setEditingDates(false); } }}>
        <div className="grid gap-4 sm:grid-cols-2">{([{ key: 'start', label: '시작일' }, { key: 'end', label: '종료일' }] as const).map(field => <label key={field.key} className="flex min-w-0 flex-col gap-2 text-sm font-medium">{field.label}<input type="date" value={draft[field.key]} max={today} aria-invalid={!!dateError} aria-describedby={dateError ? 'date-error' : undefined} onChange={event => { setDraft({ ...draft, [field.key]: event.target.value }); setDateError(''); }} className="min-h-11 min-w-0 rounded-lg border-border-light bg-card-light text-text-light focus:border-primary focus:ring-primary dark:border-border-dark dark:bg-card-dark dark:text-text-dark" /></label>)}</div>
        {dateError && <p id="date-error" role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{dateError}</p>}
        <div className="mt-6 flex justify-end gap-2"><button type="button" className={control} onClick={() => setEditingDates(false)}>취소</button><button type="submit" className={`${control} border-primary bg-primary text-primary-content`}>기간 적용</button></div>
      </form>
    </StatsDialog>}
  </div>;
}
