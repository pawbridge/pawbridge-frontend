import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getAnimals } from '../api/animals.api';
import type { AnimalSearchParams } from '../types/api.types';
import {
  applyAnimalSearchFilters,
  defaultAnimalSearch,
  hasAnimalRelevanceSearch,
  maxAnimalSearchResults,
  readAnimalSearch,
  relevanceAnimalSearchSort,
  visibleAnimalSearchPages,
  writeAnimalSearch,
} from '../utils/animalSearch';
import AnimalSearchCard from '../components/animals/AnimalSearchCard';
import AnimalSearchFilters from '../components/animals/AnimalSearchFilters';
import AnimalSearchPagination from '../components/animals/AnimalSearchPagination';
import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';

export default function Animals() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readAnimalSearch(searchParams), [searchParams]);
  const setFilters = (next: AnimalSearchParams) => setSearchParams(writeAnimalSearch(next));
  const searchReturnTo = `/animals${searchParams.size ? `?${searchParams.toString()}` : ''}`;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['animals', filters],
    queryFn: () => getAnimals(filters),
  });

  const handleFilterChange = (next: AnimalSearchParams) => setFilters(applyAnimalSearchFilters(filters, next));
  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 500, behavior: 'smooth' });
  };

  const animals = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = visibleAnimalSearchPages(data?.totalPages || 0, filters.size || defaultAnimalSearch.size);
  const currentPage = data?.number || 0;
  const relevanceSearch = hasAnimalRelevanceSearch(filters);

  return (
    <div className="min-h-screen bg-white font-display text-[#052e16] dark:bg-background-dark dark:text-text-dark">
      <Header />
      <main className="mx-auto w-full max-w-[1504px] px-4 pb-14 pt-10 md:px-6 md:pb-20 md:pt-14">
        <header className="mb-6">
          <p className="text-sm font-bold text-[#036b3c]">동물 검색</p>
          <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[#091f15] md:text-[38px]">기억나는 특징으로 빠르게 찾아보세요</h1>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-[#6e7a75] md:text-base">털색, 무늬, 착용 물품, 발견 장소처럼 기억나는 정보를 함께 입력할수록 가까운 결과를 먼저 보여드립니다.</p>
        </header>

        <AnimalSearchFilters filters={filters} onApply={handleFilterChange} onReset={() => setFilters(defaultAnimalSearch)} />

        <section aria-labelledby="animal-search-results" className="mt-10">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="animal-search-results" className="text-xl font-bold text-[#091f15] md:text-2xl">검색 결과 {totalElements.toLocaleString()}마리</h2>
              <p className="mt-1 text-xs text-[#6e7a75] md:text-sm">{filters.noticeNo ? '입력한 공고번호와 정확히 일치하는 결과예요.' : relevanceSearch ? '입력한 특징과 가까운 순서로 보여드려요.' : '최근 접수된 동물부터 보여드려요.'}</p>
            </div>
            <label className="flex items-center gap-2 self-start sm:self-auto">
              <span className="sr-only">검색 결과 정렬</span>
              <select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value, page: 0 })} className="h-10 min-w-[168px] rounded-xl border border-[#dee5e3] bg-white px-3 text-sm font-medium text-[#052e16] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                {relevanceSearch && <option value={relevanceAnimalSearchSort}>관련도순</option>}
                <option value="createdAt,desc">최근 접수순</option>
                <option value="noticeEndDate,asc">마감 임박순</option>
                <option value="age,asc">나이 어린순</option>
              </select>
            </label>
          </div>

          {isLoading && !data ? (
            <div aria-label="동물 검색 결과를 불러오는 중" className="grid gap-4 lg:grid-cols-2">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-[236px] animate-pulse rounded-2xl border border-[#dee5e3] bg-[#f6f9f7] md:h-[252px]" />)}
            </div>
          ) : error ? (
            <div role="alert" className="rounded-2xl border border-[#f1c6c6] bg-[#fff8f8] px-6 py-12 text-center">
              <h3 className="text-lg font-bold text-[#7f1d1d]">검색 결과를 불러오지 못했습니다</h3>
              <p className="mt-2 text-sm text-[#6e7a75]">잠시 후 다시 시도해 주세요.</p>
              <button type="button" onClick={() => void refetch()} className="mt-5 h-11 rounded-xl bg-[#052e16] px-6 text-sm font-bold text-white">다시 시도</button>
            </div>
          ) : animals.length === 0 ? (
            <div className="rounded-2xl border border-[#dee5e3] bg-[#f6f9f7] px-6 py-14 text-center">
              <h3 className="text-lg font-bold text-[#052e16]">조건에 맞는 동물을 찾지 못했습니다</h3>
              <p className="mt-2 text-sm text-[#6e7a75]">검색어를 줄이거나 지역과 품종 조건을 바꿔 보세요.</p>
              <button type="button" onClick={() => setFilters(defaultAnimalSearch)} className="mt-5 h-11 rounded-xl border border-[#c7ced1] bg-white px-6 text-sm font-bold text-[#2f7d68]">조건 초기화</button>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {animals.map((animal) => <AnimalSearchCard key={animal.id} animal={animal} searchReturnTo={searchReturnTo} />)}
            </div>
          )}

          {totalElements > maxAnimalSearchResults && <p className="mt-6 text-center text-xs leading-5 text-[#6e7a75]">공고 정보를 안정적으로 제공하기 위해 앞의 {maxAnimalSearchResults.toLocaleString()}마리까지 볼 수 있습니다. 조건을 좁히면 원하는 동물을 더 빠르게 찾을 수 있어요.</p>}
          {animals.length > 0 && <AnimalSearchPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
        </section>
      </main>
      <Footer />
    </div>
  );
}
