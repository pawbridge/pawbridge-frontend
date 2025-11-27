import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnimals } from '../api/animals.api';
import type { AnimalSearchParams } from '../types/api.types';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AnimalFilterSidebar from '../components/common/AnimalFilterSidebar';
import AnimalCardSimple from '../components/common/AnimalCardSimple';

export default function Animals() {
  // 필터 상태
  const [filters, setFilters] = useState<AnimalSearchParams>({
    page: 0,
    size: 21,
    sort: 'createdAt,desc',
  });

  // 뷰 모드 (그리드/리스트)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 데이터 가져오기
  const { data, isLoading, error } = useQuery({
    queryKey: ['animals', filters],
    queryFn: () => getAnimals(filters),
  });


  // 필터 변경
  const handleFilterChange = (newFilters: AnimalSearchParams) => {
    setFilters({ ...newFilters, page: 0 }); // 필터 변경 시 첫 페이지로
  };

  // 필터 초기화
  const handleReset = () => {
    setFilters({
      page: 0,
      size: 21,
      sort: 'createdAt,desc',
    });
  };

  // 정렬 변경
  const handleSortChange = (sort: string) => {
    setFilters({ ...filters, sort, page: 0 });
  };

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 로딩 상태
  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="mt-8 text-xl text-text-light dark:text-text-dark font-semibold animate-pulse">
              동물 친구들을 불러오고 있어요...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-xl p-8 max-w-md text-center border border-border-light dark:border-border-dark">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-3">
                에러가 발생했습니다
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error instanceof Error ? error.message : '알 수 없는 에러'}
              </p>
              <div className="bg-primary/10 rounded-lg p-4">
                <p className="text-sm text-text-light dark:text-text-dark">
                  ※ <strong>해결 방법:</strong> 백엔드 서버가 실행 중인지 확인해주세요
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const animals = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 0;
  const currentPage = data?.number || 0;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-text-light dark:text-text-dark">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <p className="text-4xl font-black leading-tight tracking-[-0.033em]">새로운 가족을 기다려요</p>
        </div>

        {/* 레이아웃: 사이드바 + 메인 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 사이드바 필터 */}
          <aside className="lg:col-span-1">
            <AnimalFilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
            />
          </aside>

          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-3">
            {/* 상단 바 (결과 수 + 뷰 토글 + 정렬) */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <p className="text-base text-gray-600 dark:text-gray-400">
                총 {totalElements.toLocaleString()} 마리의 친구들이 기다리고 있어요
              </p>

              <div className="flex items-center gap-4">
                {/* 뷰 토글 */}
                <div className="flex items-center border border-border-light dark:border-border-dark rounded-lg p-1 bg-background-light dark:bg-background-dark">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md ${
                      viewMode === 'grid'
                        ? 'bg-card-light dark:bg-card-dark shadow-sm text-primary'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <span className="material-symbols-outlined">grid_view</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md ${
                      viewMode === 'list'
                        ? 'bg-card-light dark:bg-card-dark shadow-sm text-primary'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <span className="material-symbols-outlined">view_list</span>
                  </button>
                </div>

                {/* 정렬 */}
                <label className="flex items-center gap-2">
                  <span className="text-sm whitespace-nowrap">정렬:</span>
                  <select
                    value={filters.sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-1 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark focus:border-primary/50 h-10 placeholder:text-gray-400 px-3 text-sm font-normal"
                  >
                    <option value="createdAt,desc">접수일순</option>
                    <option value="noticeEndDate,asc">마감임박순</option>
                    <option value="age,asc">나이순</option>
                  </select>
                </label>
              </div>
            </div>

            {/* 동물 목록 */}
            {animals.length === 0 ? (
              <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-md p-16 text-center border border-border-light dark:border-border-dark">
                <div className="text-7xl mb-6">😢</div>
                <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-3">
                  검색 결과가 없습니다
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  다른 검색 조건을 시도해보세요
                </p>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  필터 초기화
                </button>
              </div>
            ) : (
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                {animals.map((animal) => (
                  <AnimalCardSimple key={animal.id} animal={animal} />
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center pt-10 mt-10 border-t border-border-light dark:border-border-dark">
                <ul className="flex items-center -space-x-px h-10 text-base">
                  {/* 이전 버튼 */}
                  <li>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="flex items-center justify-center px-4 h-10 ms-0 leading-tight text-gray-500 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-s-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                    </button>
                  </li>

                  {/* 페이지 번호 */}
                  {(() => {
                    // 현재 페이지 기준으로 앞뒤 2페이지씩 표시
                    const pages = [];
                    const maxPages = Math.min(5, totalPages);
                    let startPage = Math.max(0, currentPage - 2);
                    let endPage = Math.min(totalPages - 1, startPage + maxPages - 1);
                    
                    // 끝에서 시작점 조정
                    if (endPage - startPage < maxPages - 1) {
                      startPage = Math.max(0, endPage - maxPages + 1);
                    }

                    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
                      const isActive = pageNum === currentPage;
                      pages.push(
                        <li key={`page-${pageNum}`}>
                          <button
                            onClick={() => handlePageChange(pageNum)}
                            className={`flex items-center justify-center px-4 h-10 leading-tight ${
                              isActive
                                ? 'text-primary bg-primary/20 border border-primary dark:border-primary'
                                : 'text-gray-500 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white'
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        </li>
                      );
                    }
                    return pages;
                  })()}

                  {/* 다음 버튼 */}
                  <li>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                      className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-e-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
