import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { discoverShelters } from '../api/publicShelters.api';
import ShelterLayout from '../components/shelters/ShelterLayout';
import ShelterDiscoveryCard from '../components/shelters/ShelterDiscoveryCard';
import AnimalSearchPagination from '../components/animals/AnimalSearchPagination';
import { koreaToday, readShelterDiscovery, shiftDate, validIntakeRange, writeShelterDiscovery, type ShelterDiscoveryFilters } from '../utils/shelterDiscovery';

const inputClass = 'mt-2 block h-11 w-full rounded-lg border-brand-border bg-white text-base text-brand-ink focus:border-brand-focus focus:ring-brand-focus';
function SearchForm({ filters, onSearch }: { filters: ShelterDiscoveryFilters; onSearch: (next: ShelterDiscoveryFilters) => void }) {
  const [draft, setDraft] = useState(filters);
  const [custom, setCustom] = useState(![7, 30, 90].some(days => filters.intakeTo === koreaToday() && filters.intakeFrom === shiftDate(filters.intakeTo, 1 - days)));
  const [error, setError] = useState('');
  return <form onSubmit={event => { event.preventDefault(); if (!validIntakeRange(draft.intakeFrom, draft.intakeTo)) { setError('접수일 시작일과 종료일을 확인해주세요. 최대 366일까지 선택할 수 있어요.'); return; } setError(''); onSearch({ ...draft, page: 0 }); }} className="my-7 space-y-5 rounded-xl border border-brand-border bg-brand-soft p-4 text-brand-ink md:p-6">
    <div className="grid items-end gap-4 sm:grid-cols-[1fr_2fr_auto]">
      <label className="text-sm font-semibold">지역<input className={inputClass} value={draft.address} onChange={e => setDraft({ ...draft, address: e.target.value })} maxLength={100} placeholder="시·도 또는 시·군·구" /></label>
      <label className="text-sm font-semibold">보호소 이름 또는 주소<input className={inputClass} value={draft.keyword} onChange={e => setDraft({ ...draft, keyword: e.target.value })} maxLength={100} placeholder="보호소 이름을 입력하세요" /></label>
      <button className="min-h-11 rounded-lg bg-brand px-8 font-bold hover:bg-brand-hover">검색</button>
    </div>
    <fieldset><legend className="text-sm font-semibold">동물 접수일</legend><div className="mt-3 flex flex-wrap gap-2">
      {[7, 30, 90].map(days => { const selected = !custom && draft.intakeTo === koreaToday() && draft.intakeFrom === shiftDate(draft.intakeTo, 1 - days); return <button key={days} type="button" aria-pressed={selected} onClick={() => { setCustom(false); setDraft({ ...draft, intakeFrom: shiftDate(koreaToday(), 1 - days), intakeTo: koreaToday() }); }} className={`min-h-11 rounded-lg border border-brand-border px-5 text-sm font-medium ${selected ? 'bg-brand' : 'bg-white'}`}>{days}일</button>; })}
      <button type="button" aria-pressed={custom} onClick={() => setCustom(true)} className={`min-h-11 rounded-lg border border-brand-border px-5 text-sm font-medium ${custom ? 'bg-brand' : 'bg-white'}`}>직접 선택</button>
    </div>
    {custom && <div className="mt-3 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2"><label className="text-sm">접수 시작일<input type="date" required value={draft.intakeFrom} onChange={e => setDraft({ ...draft, intakeFrom: e.target.value })} className={inputClass} /></label><label className="text-sm">접수 종료일<input type="date" required value={draft.intakeTo} onChange={e => setDraft({ ...draft, intakeTo: e.target.value })} className={inputClass} /></label></div>}
    <p className="mt-3 text-xs leading-5">선택한 접수일: {draft.intakeFrom} – {draft.intakeTo} · 검색 버튼으로 적용</p>
    <p className="mt-1 text-xs leading-5 text-brand-muted">선택한 기간에 접수된 동물 중, 현재 수집 정보가 ‘보호중’인 동물을 보여드려요.</p>
    {error && <p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}</fieldset>
  </form>;
}

export default function Shelters() {
  const [params, setParams] = useSearchParams();
  const filters = readShelterDiscovery(params);
  const result = useQuery({ queryKey: ['shelter-discovery', filters], queryFn: ({ signal }) => discoverShelters(filters, signal), retry: false });
  const reset = () => setParams({});
  return <ShelterLayout><div className="mx-auto max-w-[1216px]">
    <p className="mb-4 text-xs text-brand-muted dark:text-gray-300"><Link to="/">홈</Link> / 보호소 찾기</p>
    <h1 className="text-2xl font-bold tracking-tight md:text-[34px]">보호소에서 기다리는 동물을 만나보세요</h1>
    <p className="mt-3 text-sm leading-6 text-brand-muted dark:text-gray-300">지역과 접수일로 찾고, 보호소별로 어떤 동물이 있는지 살펴보세요.</p>
    <SearchForm key={JSON.stringify(filters)} filters={filters} onSearch={next => setParams(writeShelterDiscovery(next))} />
    <p className="mb-5 text-xs leading-5 text-brand-muted dark:text-gray-300">APMS 수집 정보 기준입니다. 실제 보호 상태와 다를 수 있으니 방문·입양 전 보호소에 확인해 주세요.</p>
    {result.isPending ? <p role="status" className="py-16 text-center">보호소를 불러오고 있어요.</p>
      : result.isError ? <div role="alert" className="rounded-xl border border-brand-border p-10 text-center"><h2 className="text-xl font-bold">보호소를 불러오지 못했어요</h2><button onClick={() => void result.refetch()} className="mt-5 min-h-11 rounded-lg bg-brand px-6 font-bold text-brand-ink">다시 시도</button></div>
      : <section aria-label="보호소 검색 결과"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-lg font-bold">조건에 맞는 보호소 {result.data.totalElements.toLocaleString()}곳</p><button onClick={reset} className="min-h-11 text-sm underline underline-offset-4">검색 조건 초기화</button></div>
        <p className="mb-4 text-xs text-brand-muted dark:text-gray-300">접수일 {filters.intakeFrom} – {filters.intakeTo} · 보호중 동물 많은 순</p>
        {!result.data.content.length ? <div className="rounded-xl border border-brand-border px-6 py-16 text-center"><h2 className="text-xl font-bold">조건에 맞는 보호소가 없어요</h2><p className="mt-3 text-sm text-brand-muted dark:text-gray-300">접수일 기간을 넓히거나 검색어·지역을 바꿔 보세요.</p><button onClick={reset} className="mt-5 min-h-11 px-5 underline">최근 30일 조건으로 돌아가기</button></div>
          : <ul className="space-y-5">{result.data.content.map(shelter => <li key={shelter.id}><ShelterDiscoveryCard shelter={shelter} filters={filters} /></li>)}</ul>}
        <AnimalSearchPagination currentPage={filters.page} totalPages={Math.min(result.data.totalPages, 833)} onPageChange={page => { setParams(writeShelterDiscovery({ ...filters, page })); window.scrollTo({ top: 0, behavior: 'instant' }); }} />
      </section>}
  </div></ShelterLayout>;
}
