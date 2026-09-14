import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { findPublicShelters } from '../api/publicShelters.api';
import ShelterLayout from '../components/shelters/ShelterLayout';
import Pagination from '../components/common/Pagination';
import { shelterSearch, shelterSearchParams } from '../lib/shelters';

function SearchForm({ keyword, address, onSearch }: { keyword: string; address: string; onSearch: (keyword: string, address: string) => void }) {
  const [name, setName] = useState(keyword);
  const [region, setRegion] = useState(address);
  return <form onSubmit={e => { e.preventDefault(); onSearch(name, region); }} className="my-8 grid items-end gap-4 rounded-xl border border-border-light p-5 dark:border-border-dark sm:grid-cols-[1fr_2fr_auto]">
    <label className="space-y-2 text-sm font-semibold">지역
      <input className="block h-12 w-full rounded-lg border-border-light bg-transparent text-base dark:border-border-dark" value={region} onChange={e => setRegion(e.target.value)} maxLength={100} placeholder="시·도 또는 시·군·구" />
    </label>
    <label className="space-y-2 text-sm font-semibold">보호소 이름 또는 주소
      <input className="block h-12 w-full rounded-lg border-border-light bg-transparent text-base dark:border-border-dark" value={name} onChange={e => setName(e.target.value)} maxLength={100} placeholder="이름이나 주소를 입력해 주세요" />
    </label>
    <button className="h-12 rounded-lg bg-primary px-8 font-bold text-primary-content">검색</button>
  </form>;
}
export default function Shelters() {
  const [params, setParams] = useSearchParams();
  const { keyword, address, page } = shelterSearch(params);
  const result = useQuery({ queryKey: ['public-shelters', keyword, address, page],
    queryFn: ({ signal }) => findPublicShelters(keyword, address, page, signal), retry: false });
  const reset = () => setParams({});
  return <ShelterLayout>
    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">보호소 찾기</h1>
    <p className="mt-3 text-gray-600 dark:text-gray-400">지역과 이름으로 보호소를 찾고, 보호 중인 동물을 만나보세요.</p>
    <SearchForm key={`${keyword}\n${address}`} keyword={keyword} address={address} onSearch={(k, a) => setParams(shelterSearchParams(k, a))} />
    {(keyword || address) && <button onClick={reset} className="mb-4 min-h-11 text-sm underline underline-offset-4">검색 조건 초기화</button>}
    {result.isPending ? <p role="status" className="py-16 text-center">보호소를 불러오고 있어요.</p>
      : result.isError ? <div role="alert" className="rounded-xl border border-border-light p-10 text-center"><h2 className="text-xl font-bold">보호소를 불러오지 못했어요</h2><button onClick={() => void result.refetch()} className="mt-5 min-h-12 rounded-lg bg-primary px-6 font-bold text-primary-content">다시 시도</button></div>
      : <section aria-label="보호소 검색 결과">
        <p role="status" className="mb-5 text-sm">총 <strong>{result.data.totalElements.toLocaleString()}</strong>곳</p>
        {!result.data.content.length ? <div className="rounded-xl border border-border-light px-6 py-16 text-center"><h2 className="text-xl font-bold">조건에 맞는 보호소가 없어요</h2><p className="mt-3 text-gray-600 dark:text-gray-400">검색어를 줄이거나 지역을 바꿔 보세요.</p><button onClick={reset} className="mt-5 min-h-11 px-5 underline">전체 보호소 보기</button></div>
          : <ul className="grid gap-5 md:grid-cols-2">{result.data.content.map(shelter => <li key={shelter.id}>
            <Link to={`/shelters/${encodeURIComponent(shelter.careRegNo)}?${params.toString()}`} className="group flex h-full flex-col gap-3 rounded-xl border border-border-light p-6 transition-colors hover:border-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 dark:border-border-dark">
              <p className="text-sm text-gray-600 dark:text-gray-400">{shelter.organizationName || '관할기관 정보 없음'}</p>
              <h2 className="break-words text-xl font-bold">{shelter.name}</h2>
              <p className="break-words text-sm leading-6 text-gray-600 dark:text-gray-400">{shelter.address || '주소가 등록되지 않았어요.'}</p>
              <span className="mt-auto pt-3 text-sm font-semibold text-emerald-800 dark:text-primary">상세 정보 보기 →</span>
            </Link>
          </li>)}</ul>}
        <Pagination currentPage={page} totalPages={result.data.totalPages} onPageChange={p => { setParams(shelterSearchParams(keyword, address, p)); window.scrollTo({ top: 0, behavior: 'instant' }); }} />
      </section>}
  </ShelterLayout>;
}
