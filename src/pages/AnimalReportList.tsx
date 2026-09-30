import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Pagination from '../components/common/Pagination';
import { getAnimalReports } from '../api/animalReports.api';
import { reportListPath } from '../lib/reportNavigation';
import ReportSearchFilters from '../components/reports/ReportSearchFilters';
import { readReportSearch, reportSearchParams, reportSearchError, type ReportSearch } from '../lib/reportSearch';
import type { AnimalReportKind, AnimalReportResponse } from '../types/api.types';

function ReportPhoto({ src, title }: { src?: string; title: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <img src={src} alt={title} loading="lazy"
    className="h-[220px] w-full rounded-xl bg-brand-soft object-cover" onError={() => setFailed(true)} />
    : <div className="flex h-[220px] items-center justify-center rounded-xl bg-brand-soft px-4 text-center text-sm text-brand-muted dark:bg-gray-800 dark:text-gray-300">
      {failed ? '사진을 불러오지 못했어요' : '사진이 등록되지 않았어요'}
    </div>;
}

function ReportCard({ report }: { report: AnimalReportResponse }) {
  const missing = report.kind === 'MISSING';
  return <Link to={`/reports/${report.reportId}`} className="flex min-w-0 flex-col gap-4 rounded-2xl border border-brand-border bg-white p-4 transition-colors hover:border-brand-focus focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-focus dark:border-gray-700 dark:bg-gray-900">
    <ReportPhoto key={report.imageUrls[0] || 'no-photo'} src={report.imageUrls[0]} title={report.title} />
    <div className="flex min-w-0 flex-1 flex-col gap-3 break-words">
      <p className="text-sm font-medium leading-5 text-brand-muted dark:text-gray-300">{missing ? '실종 알림' : '목격 제보'}</p>
      <h3 className="min-h-14 line-clamp-2 text-xl font-bold leading-7">{report.title}</h3>
      <div className="text-base leading-[26px]">
        <p>{missing ? '실종' : '목격'}일: {report.occurredOn}</p>
        <p className="line-clamp-2">{report.region}{report.landmark ? ` · ${report.landmark}` : ''}</p>
      </div>
      <p className="line-clamp-2 text-base leading-[26px] text-brand-muted dark:text-gray-300">
        {[report.species, report.coatColor, report.animalSize, report.distinguishingFeatures].filter(Boolean).join(' · ')}
      </p>
      <p className="mt-auto pt-1 text-sm leading-6 text-brand-muted dark:text-gray-400">등록일: {new Date(report.createdAt).toLocaleDateString('ko-KR')}</p>
    </div>
  </Link>;
}

export default function AnimalReportList({ kind }: { kind: AnimalReportKind }) {
  const [params, setParams] = useSearchParams();
  const filters = readReportSearch(params);
  const { keyword } = filters;
  const filterError = reportSearchError(filters);
  const hasFilters = Boolean(keyword || filters.province || filters.district || filters.animalType || filters.from || filters.to);
  const pageValue = Number(params.get('page') || '1');
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 && pageValue <= 2147483647 ? pageValue - 1 : 0;
  const missing = kind === 'MISSING';
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', kind, filters, page],
    queryFn: () => getAnimalReports(page, 12, kind, filters),
    enabled: !filterError,
    retry: false,
    staleTime: 30_000,
  });
  function changeSearch(nextFilters: ReportSearch, nextPage = 0) {
    setParams(reportSearchParams(nextFilters, nextPage));
  }
  const tabParams = reportSearchParams(filters).toString();
  const query = tabParams ? `?${tabParams}` : '';
  return <div className="flex min-h-screen flex-col bg-background-light font-display text-brand-ink dark:bg-background-dark dark:text-white">
    <Header />
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-16">
      <div>
        <h1 className="text-[28px] font-bold leading-[42px]">실종동물 찾기</h1>
        <p className="mt-2 text-sm leading-6 text-brand-muted dark:text-gray-300">실종 알림과 목격 제보를 살펴보고, 동물을 다시 만날 수 있도록 함께 도와주세요.</p>
      </div>
      <nav aria-label="제보 종류" className="grid grid-cols-2 gap-3 sm:flex">
        {(['MISSING', 'SIGHTING'] as const).map(tab => <Link key={tab} to={`${reportListPath(tab)}${query}`} aria-current={tab === kind ? 'page' : undefined}
          className={`flex min-h-12 items-center justify-center rounded-lg border px-4 text-sm sm:w-[180px] ${tab === kind ? 'border-brand bg-brand font-bold text-brand-ink' : 'border-brand-border font-medium hover:bg-neutral-100 dark:border-gray-700 dark:hover:bg-gray-800'}`}>
          {tab === 'MISSING' ? '실종 알림' : '목격 제보'}
        </Link>)}
      </nav>
      <ReportSearchFilters key={`${kind}:${params.toString()}`} filters={filters} onSearch={value => changeSearch(value)} />
      {filterError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{filterError}</p>}
      <p className="text-xs leading-5 text-brand-muted dark:text-gray-300">지역·종류 필터는 해당 항목이 선택된 제보를 조회합니다. 분류되지 않은 기존 글은 전체 또는 키워드 검색으로 확인해 주세요.</p>
      <p className="rounded-xl bg-brand-soft p-4 text-sm leading-6 dark:bg-gray-800">
        {missing ? '우리 동물을 잃어버렸다면 실종 알림을, 다른 동물을 봤다면 목격 제보를 남겨 주세요.' : '목격 제보는 발견 당시의 정보입니다. 지금도 같은 장소에 있다는 뜻은 아니에요.'}
      </p>
      <section aria-labelledby="reports-heading" className="flex flex-col gap-6" aria-busy={isLoading}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="reports-heading" className="text-xl font-bold leading-7">{missing ? '가족을 찾고 있어요' : '발견한 단서를 나눠요'}</h2>
            <p className="mt-2 text-sm text-brand-muted dark:text-gray-300">{data && !isError ? `현재 페이지 ${data.content.length}건 · 최신 등록순` : '최신 등록순'}{keyword && ` · 검색어: ${keyword}`}</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link to={`/reports/new?kind=${kind}`} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand px-6 text-sm font-bold text-brand-ink hover:bg-brand-hover">{missing ? '실종 알리기' : '목격 제보하기'}</Link>
            <p className="text-xs leading-[18px] text-brand-muted dark:text-gray-400">열람은 누구나 · 작성은 로그인 후</p>
          </div>
        </div>
        {isLoading ? <div role="status" className="rounded-xl border border-brand-border px-6 py-16 text-center dark:border-gray-700">제보를 불러오는 중입니다.</div>
          : isError ? <div role="alert" className="rounded-xl border border-brand-border px-6 py-16 text-center dark:border-gray-700">
            <p>제보를 불러오지 못했습니다.</p><button type="button" onClick={() => refetch()} className="mt-4 min-h-11 rounded-lg border border-brand-border px-5 font-bold hover:bg-neutral-100 dark:hover:bg-gray-800">다시 시도</button>
          </div>
          : data?.content.length ? <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{data.content.map(report => <ReportCard key={report.reportId} report={report} />)}</div>
          : <div role="status" className="rounded-xl border border-brand-border px-6 py-16 text-center dark:border-gray-700">
            <p>{filterError ? '검색 조건을 확인해 주세요.' : hasFilters ? '검색 조건에 맞는 제보가 없습니다.' : page ? '이 페이지에는 제보가 없습니다.' : '아직 등록된 제보가 없습니다.'}</p>
            <p className="mt-2 text-sm text-brand-muted dark:text-gray-300">{hasFilters ? '조건을 바꾸거나 초기화해 보세요.' : '실종·목격 정보를 알고 있다면 제보를 남겨 주세요.'}</p>
            {page > 0 && <button type="button" onClick={() => changeSearch(filters)} className="mt-4 min-h-11 rounded-lg border border-brand-border px-5 font-bold">첫 페이지로</button>}
          </div>}
        {!filterError && !isError && !isLoading && <Pagination currentPage={page} totalPages={data?.totalPages || 0} separated onPageChange={next => { changeSearch(filters, next); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
      </section>
    </main>
    <Footer />
  </div>;
}
