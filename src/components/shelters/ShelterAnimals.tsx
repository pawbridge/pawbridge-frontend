import { useEffect, useRef, useState } from 'react';
import { useIsFetching, useQueries, useQuery } from '@tanstack/react-query';
import { useLocation, useSearchParams } from 'react-router-dom';
import { getAnimals } from '../../api/animals.api';
import AnimalCardSimple from '../common/AnimalCardSimple';
import AnimalSearchPagination from '../animals/AnimalSearchPagination';
import useShelterScroll from '../../hooks/useShelterScroll';
import { koreaToday, shiftDate, validIntakeRange } from '../../utils/shelterDiscovery';
import {
  maxShelterAnimalPages, readShelterAnimals, shelterAnimalPageSize, shelterAnimalRequest,
  shelterLastValidPage, shelterPageCount, shelterSpecies, writeShelterAnimals, type ShelterAnimalFilters,
} from '../../utils/shelterDetail';

const speciesLabels = { '': '전체', DOG: '개', CAT: '고양이', ETC: '기타' };
const selectClass = 'mt-2 h-12 w-full rounded-lg border-brand-border bg-white px-3 text-sm text-brand-ink dark:bg-card-dark dark:text-text-dark';

export function ShelterAnimalSummary({ shelterId }: { shelterId: number }) {
  const counts = useQueries({ queries: shelterSpecies.map(species => ({
    queryKey: ['shelter-animal-count', shelterId, species],
    queryFn: ({ signal }: { signal: AbortSignal }) => getAnimals({ shelterId, species: species || undefined, status: 'PROTECT', page: 0, size: 1, sort: 'createdAt,desc' }, signal),
    retry: false, staleTime: 30_000,
  })) });
  return <section aria-label="접수기간 전체 보호중 요약" className="space-y-3">
    <dl className="grid grid-cols-3 gap-2 xl:grid-cols-4 xl:gap-4">
      {counts.map((count, index) => <div key={shelterSpecies[index]} className={index === 0
        ? 'col-span-3 rounded-2xl border border-brand-border p-6 xl:col-span-1'
        : 'flex flex-wrap items-center justify-center gap-x-2 rounded-full border border-brand-border px-3 py-2 xl:flex-col xl:items-start xl:justify-start xl:gap-3 xl:rounded-2xl xl:p-6'}>
        <dt className="text-sm text-brand-muted dark:text-gray-300">{index === 0 ? '전체 보호중' : speciesLabels[shelterSpecies[index]]}</dt>
        <dd className={index === 0 ? 'my-3 text-[28px] font-bold leading-[42px]' : 'text-sm font-bold xl:text-[28px] xl:leading-[42px]'}>
          {count.isError ? '확인 불가' : count.isPending ? '확인 중…' : <>{count.data.totalElements.toLocaleString()}<span className="ml-1 text-sm font-normal">마리</span></>}
        </dd>
        <dd className={index === 0 ? 'text-xs text-brand-muted dark:text-gray-300' : 'hidden text-xs text-brand-muted dark:text-gray-300 xl:block'}>{index === 0 ? '접수기간 전체 · 수집 정보 기준' : '현재 보호중인 동물'}</dd>
      </div>)}
    </dl>
    {counts.some(count => count.isError) && <p role="alert" className="text-sm">일부 마릿수를 불러오지 못했어요. <button type="button" onClick={() => counts.forEach(count => { if (count.isError) void count.refetch(); })} className="min-h-11 underline">마릿수 다시 불러오기</button></p>}
    <p className="text-xs leading-5 text-brand-muted dark:text-gray-300">APMS 수집 정보 기준입니다. 실제 보호 상태는 보호소에 확인해 주세요.</p>
  </section>;
}

function IntakeFilter({ filters, onChange }: { filters: ShelterAnimalFilters; onChange: (range: Pick<ShelterAnimalFilters, 'intakeFrom' | 'intakeTo'>) => void }) {
  const today = koreaToday();
  const preset = !filters.intakeFrom ? 'all' : [7, 30, 90].find(days => filters.intakeTo === today && filters.intakeFrom === shiftDate(today, 1 - days))?.toString() || 'custom';
  const [custom, setCustom] = useState(preset === 'custom');
  const [from, setFrom] = useState(filters.intakeFrom || shiftDate(today, -29));
  const [to, setTo] = useState(filters.intakeTo || today);
  const [error, setError] = useState('');
  return <div className="min-w-0">
    <label htmlFor="shelter-intake-range" className="block text-sm font-medium">동물 접수일</label>
      <select id="shelter-intake-range" value={custom ? 'custom' : preset} className={selectClass} onChange={event => {
        const value = event.target.value;
        setCustom(value === 'custom'); setError('');
        if (value === 'all') onChange({ intakeFrom: undefined, intakeTo: undefined });
        else if (value !== 'custom') onChange({ intakeFrom: shiftDate(today, 1 - Number(value)), intakeTo: today });
      }}>
        <option value="all">전체 기간</option>{[7, 30, 90].map(days => <option key={days} value={days}>최근 {days}일</option>)}<option value="custom">직접 선택</option>
      </select>
    {custom && <form className="mt-3 space-y-3" onSubmit={event => { event.preventDefault(); if (!validIntakeRange(from, to)) { setError('실제 날짜를 순서대로 선택해 주세요. 최대 366일까지 선택할 수 있어요.'); return; } setError(''); onChange({ intakeFrom: from, intakeTo: to }); }}>
      <label className="block text-sm">접수 시작일<input type="date" required value={from} onChange={event => setFrom(event.target.value)} className={selectClass} /></label>
      <label className="block text-sm">접수 종료일<input type="date" required value={to} onChange={event => setTo(event.target.value)} className={selectClass} /></label>
      {error && <p role="alert" className="text-sm text-red-800 dark:text-red-300">{error}</p>}
      <button type="submit" className="min-h-11 rounded-lg border border-brand-border px-4 text-sm font-medium">기간 적용</button>
    </form>}
  </div>;
}

export default function ShelterAnimals({ shelterId, shelterName }: { shelterId: number; shelterName: string }) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const filters = readShelterAnimals(params);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusAfterChange = useRef(false);
  const historyFetching = useIsFetching({ queryKey: ['shelter-observations', shelterId] });
  const result = useQuery({ queryKey: ['shelter-animals', shelterId, filters],
    queryFn: ({ signal }) => getAnimals(shelterAnimalRequest(shelterId, filters), signal), retry: false });
  const validPage = result.data ? shelterLastValidPage(filters.page, result.data.totalPages) : filters.page;
  const correctingPage = validPage !== filters.page;
  useShelterScroll(!result.isPending && !correctingPage && historyFetching === 0, true);

  useEffect(() => {
    if (!correctingPage) return;
    setParams(writeShelterAnimals(params, { ...filters, page: validPage }), { replace: true, state: location.state });
  }, [correctingPage, validPage, filters, params, setParams, location.state]);
  useEffect(() => {
    if (!focusAfterChange.current || result.isPending || correctingPage) return;
    focusAfterChange.current = false;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [result.isPending, correctingPage, params]);

  const change = (patch: Partial<ShelterAnimalFilters>) => {
    focusAfterChange.current = true;
    const page = patch.page ?? 0;
    setParams(writeShelterAnimals(params, { ...filters, ...patch, page }), { state: { ...location.state, shelterRestoreKey: undefined } });
  };
  const reset = () => change({ species: '', intakeFrom: undefined, intakeTo: undefined });
  const returnTo = location.pathname + location.search;
  const animals = result.data?.content || [];
  const total = result.data?.totalElements || 0;
  const busy = result.isPending || correctingPage;

  return <section id="shelter-animals" aria-labelledby="shelter-animals-heading" aria-busy={busy} className="scroll-mt-24 space-y-4">
    <h2 ref={heading} id="shelter-animals-heading" tabIndex={-1} className="scroll-mt-24 text-xl font-bold leading-7">보호 중인 동물</h2>
    <p className="text-sm leading-6 text-brand-muted dark:text-gray-300">사진이나 카드를 누르면 동물 상세로 이동합니다.</p>
    <div role="group" aria-label="동물 종류 선택" className="flex flex-wrap gap-2">
      {shelterSpecies.map(species => <button key={species} type="button" aria-pressed={filters.species === species} onClick={() => change({ species })} className={`inline-flex min-h-11 min-w-[72px] items-center justify-center gap-2 rounded-full border border-brand-border px-4 text-sm font-medium ${filters.species === species ? 'bg-brand text-brand-ink' : 'bg-white dark:bg-card-dark'}`}>{filters.species === species && <img src="/reports/search-period-check.svg" alt="" width="16" height="16" />}{speciesLabels[species]}</button>)}
    </div>
    <div className="grid items-start gap-3 sm:max-w-[532px] sm:grid-cols-2">
      <IntakeFilter key={`${filters.intakeFrom}:${filters.intakeTo}`} filters={filters} onChange={change} />
      <div><label htmlFor="shelter-animal-sort" className="block text-sm font-medium">정렬</label><select id="shelter-animal-sort" value={filters.sort} onChange={event => change({ sort: event.target.value as ShelterAnimalFilters['sort'] })} className={selectClass}><option value="happenDate,desc">발견일 최신순</option><option value="happenDate,asc">발견일 오래된순</option><option value="createdAt,desc">최근 등록순</option></select></div>
    </div>
    <p className="text-xs leading-5 text-brand-muted dark:text-gray-300">적용한 접수일: {filters.intakeFrom ? `${filters.intakeFrom} – ${filters.intakeTo}` : '전체 기간'} · 현재 수집 정보가 ‘보호중’인 동물</p>
    {busy ? <div role="status"><p className="mb-4 text-sm">{correctingPage ? '마릿수가 바뀌어 마지막 페이지를 확인하고 있어요.' : '동물을 불러오고 있어요.'}</p><div className="grid gap-6 xl:grid-cols-2">{[0, 1, 2, 3].map(item => <div key={item} className="h-64 animate-pulse rounded-2xl border border-brand-border bg-stone-50 dark:bg-card-dark" />)}</div></div>
      : result.isError ? <div role="alert" className="rounded-2xl border border-brand-border p-6"><h3 className="text-lg font-bold">동물 목록을 불러오지 못했어요</h3><p className="mt-2 text-sm">보호소 정보와 연락처는 위에서 확인할 수 있어요.</p><button type="button" onClick={() => void result.refetch()} disabled={result.isFetching} className="mt-4 min-h-11 rounded-lg bg-brand px-5 font-medium text-brand-ink disabled:opacity-50">동물 목록 다시 불러오기</button></div>
      : <>
        <p role="status" className="text-sm">전체 {total.toLocaleString()}마리{animals.length > 0 ? ` 중 ${filters.page * shelterAnimalPageSize + 1}–${filters.page * shelterAnimalPageSize + animals.length}마리` : ''}</p>
        {animals.length === 0 ? <div className="rounded-2xl border border-brand-border p-8 text-center"><h3 className="text-lg font-bold">조건에 맞는 동물이 없어요</h3><p className="mt-2 text-sm text-brand-muted dark:text-gray-300">종류나 접수기간을 바꿔 보세요.</p><button type="button" onClick={reset} className="mt-4 min-h-11 rounded-lg border border-brand-border px-5 font-medium">동물 조건 초기화</button></div>
          : <div className="grid items-start gap-6 xl:grid-cols-2" data-testid="shelter-animal-list">{animals.map(animal => <AnimalCardSimple key={animal.id} animal={{ ...animal, shelterName: animal.shelterName || shelterName }} navigationState={{ shelterDetailReturnTo: returnTo, shelterDetailState: location.state, shelterRestoreKey: location.key }} />)}</div>}
        {total > maxShelterAnimalPages * shelterAnimalPageSize && <p className="text-sm">앞의 {(maxShelterAnimalPages * shelterAnimalPageSize).toLocaleString()}마리까지 볼 수 있어요. 종류나 접수기간으로 조건을 좁혀 주세요.</p>}
        {animals.length > 0 && <AnimalSearchPagination currentPage={filters.page} totalPages={shelterPageCount(result.data?.totalPages || 0)} onPageChange={page => change({ page })} compactOnMobile />}
      </>}
  </section>;
}
