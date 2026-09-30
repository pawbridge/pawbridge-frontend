import { useState, type FormEvent } from 'react';
import { emptyReportSearch, koreaToday, reportPeriodRange, reportSearchError, type ReportSearch } from '../../lib/reportSearch';
import ReportClassificationFields from './ReportClassificationFields';
import { reportFieldClass } from '../../lib/reportFields';

export default function ReportSearchFilters({ filters, onSearch }: { filters: ReportSearch; onSearch: (filters: ReportSearch) => void }) {
  const [draft, setDraft] = useState(filters);
  const [error, setError] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    const next = { ...draft, keyword: draft.keyword.trim() };
    const error = reportSearchError(next);
    setError(error);
    if (!error) onSearch(next);
  }
  return <form role="search" aria-label="제보 검색" onSubmit={submit}
    className="flex flex-col gap-4 rounded-xl bg-brand-soft p-6 dark:bg-gray-800">
    <ReportClassificationFields province={draft.province} district={draft.district} animalType={draft.animalType}
      onChange={value => { setDraft({ ...draft, ...value }); setError(''); }} />
    <fieldset className="min-w-0">
      <legend className="text-sm font-medium">실종·목격 날짜 기준</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {([{ value: 'all', label: '전체' }, { value: '7', label: '최근 7일' }, { value: '30', label: '최근 30일' }, { value: 'custom', label: '직접 선택' }] as const).map(option =>
          <button type="button" key={option.value} aria-pressed={draft.period === option.value}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium ${draft.period === option.value ? 'border-brand-ink bg-brand text-brand-ink' : 'border-brand-border bg-white hover:bg-neutral-100 dark:bg-gray-900 dark:hover:bg-gray-700'}`}
            onClick={() => { setDraft({ ...draft, period: option.value,
              ...(option.value === '7' || option.value === '30' ? reportPeriodRange(Number(option.value) as 7 | 30)
                : option.value === 'all' ? { from: '', to: '' } : { from: draft.from, to: draft.to }) }); setError(''); }}>
            {draft.period === option.value && <img src="/reports/search-period-check.svg" alt="" />}
            {option.label}
          </button>)}
      </div>
      {draft.period === 'custom' && <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-[416px]">
        <label className="min-w-0 text-sm font-medium">시작일<input className={reportFieldClass} type="date" required max={draft.to || koreaToday()} value={draft.from}
          onChange={event => { setDraft({ ...draft, from: event.target.value }); setError(''); }} /></label>
        <label className="min-w-0 text-sm font-medium">종료일<input className={reportFieldClass} type="date" required min={draft.from || undefined} max={koreaToday()} value={draft.to}
          onChange={event => { setDraft({ ...draft, to: event.target.value }); setError(''); }} /></label>
      </div>}
      <p className="mt-2 text-xs leading-5 text-brand-muted dark:text-gray-300">글 등록일이 아닌 실종·목격 날짜로 조회합니다.</p>
      {(draft.period === '7' || draft.period === '30') && <p className="text-xs leading-5 text-brand-muted dark:text-gray-300">{draft.from} ~ {draft.to}</p>}
    </fieldset>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <label className="min-w-0 flex-1 text-sm font-medium">특징·지역 키워드
        <input type="search" className={reportFieldClass} maxLength={100} value={draft.keyword} placeholder="털색, 목줄, 주변 장소 등"
          onChange={event => { setDraft({ ...draft, keyword: event.target.value }); setError(''); }} />
      </label>
      <div className="flex gap-3">
        <button type="button" className="min-h-12 rounded-lg border border-brand-border bg-white px-5 text-sm font-bold dark:bg-gray-900"
          onClick={() => { setDraft(emptyReportSearch); setError(''); onSearch(emptyReportSearch); }}>초기화</button>
        <button type="submit" className="min-h-12 flex-1 rounded-lg bg-brand px-8 text-sm font-bold text-brand-ink hover:bg-brand-hover">검색</button>
      </div>
    </div>
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
  </form>;
}
