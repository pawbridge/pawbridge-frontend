import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDailySignupStats, getDailyAnimalStats } from '../api/stats.api';
import { useAuthStore } from '../store/authStore';
import AdminSidebar from '../components/layout/AdminSidebar';

type PeriodType = 'today' | '7days' | '30days' | 'month';
type TabType = 'signup' | 'animal';

export default function AdminStatistics() {
  const { user } = useAuthStore();

  // 상태 관리
  const [selectedTab, setSelectedTab] = useState<TabType>('signup');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 한국 시간대(KST) 날짜를 YYYY-MM-DD 형식으로 변환
  const getKSTDate = (date: Date): string => {
    const kstOffset = 9 * 60; // KST는 UTC+9
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const kstDate = new Date(utc + (kstOffset * 60000));

    const year = kstDate.getFullYear();
    const month = String(kstDate.getMonth() + 1).padStart(2, '0');
    const day = String(kstDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // 기간에 따라 날짜 계산
  const getDateRange = () => {
    const today = new Date();
    const end = getKSTDate(today);
    let start = end;

    switch (selectedPeriod) {
      case 'today':
        start = end;
        break;
      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        start = getKSTDate(sevenDaysAgo);
        break;
      case '30days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 29);
        start = getKSTDate(thirtyDaysAgo);
        break;
      case 'month':
        const kstToday = getKSTDate(today);
        const [year, month] = kstToday.split('-');
        start = `${year}-${month}-01`;
        break;
    }

    return { start, end };
  };

  const { start: calculatedStartDate, end: calculatedEndDate } = getDateRange();
  const finalStartDate = startDate || calculatedStartDate;
  const finalEndDate = endDate || calculatedEndDate;

  // 가입자 통계 조회
  const { data: signupStats = [], isLoading: isLoadingSignup } = useQuery({
    queryKey: ['signup-stats', finalStartDate, finalEndDate],
    queryFn: () => getDailySignupStats(finalStartDate, finalEndDate),
    enabled: selectedTab === 'signup',
  });

  // 동물 등록 통계 조회
  const { data: animalStats = [], isLoading: isLoadingAnimal } = useQuery({
    queryKey: ['animal-stats', finalStartDate, finalEndDate],
    queryFn: () => getDailyAnimalStats(finalStartDate, finalEndDate),
    enabled: selectedTab === 'animal',
  });

  const currentStats = selectedTab === 'signup' ? signupStats : animalStats;
  const isLoading = selectedTab === 'signup' ? isLoadingSignup : isLoadingAnimal;

  // 최대값 계산 (그래프용)
  const maxCount = currentStats.length > 0 ? Math.max(...currentStats.map(s => s.count)) : 50;

  // 전일 대비 계산
  const calculateChangeRate = (current: number, previous: number | undefined) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // 페이지네이션
  const totalPages = Math.ceil(currentStats.length / itemsPerPage);
  const paginatedStats = [...currentStats].reverse().slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${year}년 ${month}월 ${String(day).padStart(2, '0')}일 (${weekday})`;
  };

  // 짧은 날짜 포맷 (그래프용)
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white h-screen overflow-hidden flex">
      <AdminSidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
        {/* 헤더 */}
        <header className="h-16 flex items-center justify-between px-8 bg-surface-light dark:bg-surface-dark border-b border-[#e5e7eb] dark:border-gray-700 shrink-0 z-10">
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-text-sub dark:text-gray-400 hover:text-text-main hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800"></span>
            </button>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-text-main dark:text-white">{user?.name || '관리자'}</p>
                <p className="text-xs text-text-sub dark:text-gray-400">Super Admin</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <span className="material-symbols-outlined text-primary text-[20px]">person</span>
              </div>
            </div>
          </div>
        </header>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            {/* 페이지 헤더 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="mb-6">
                <h1 className="text-text-main dark:text-white text-2xl font-black leading-tight">통계</h1>
                <p className="text-text-sub dark:text-gray-400 text-sm mt-1">플랫폼의 성장 지표와 활동 내역을 확인하세요.</p>
              </div>

              {/* 필터 영역 */}
              <div className="flex flex-wrap items-end gap-4">
                {/* 날짜 범위 선택 */}
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <label className="absolute -top-2.5 left-3 bg-gray-50 dark:bg-gray-800 px-1 text-[10px] font-bold text-text-sub dark:text-gray-400">
                      시작일
                    </label>
                    <input
                      type="date"
                      value={startDate || calculatedStartDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 h-10 w-40 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-text-main dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <span className="text-gray-400 font-medium">~</span>
                  <div className="relative">
                    <label className="absolute -top-2.5 left-3 bg-gray-50 dark:bg-gray-800 px-1 text-[10px] font-bold text-text-sub dark:text-gray-400">
                      종료일
                    </label>
                    <input
                      type="date"
                      value={endDate || calculatedEndDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 h-10 w-40 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-text-main dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                {/* 기간 선택 버튼 */}
                <div className="flex h-[54px] items-center rounded-xl bg-gray-50 dark:bg-gray-800 p-1.5">
                  <button
                    onClick={() => {
                      setSelectedPeriod('today');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className={`h-full px-3 rounded-lg transition-all text-sm font-medium ${
                      selectedPeriod === 'today'
                        ? 'bg-white dark:bg-gray-900 shadow-sm text-text-main dark:text-white'
                        : 'text-text-sub dark:text-gray-400 hover:text-text-main dark:hover:text-white'
                    }`}
                  >
                    오늘
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPeriod('7days');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className={`h-full px-3 rounded-lg transition-all text-sm font-medium ${
                      selectedPeriod === '7days'
                        ? 'bg-white dark:bg-gray-900 shadow-sm text-text-main dark:text-white'
                        : 'text-text-sub dark:text-gray-400 hover:text-text-main dark:hover:text-white'
                    }`}
                  >
                    최근 7일
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPeriod('30days');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className={`h-full px-3 rounded-lg transition-all text-sm font-medium ${
                      selectedPeriod === '30days'
                        ? 'bg-white dark:bg-gray-900 shadow-sm text-text-main dark:text-white'
                        : 'text-text-sub dark:text-gray-400 hover:text-text-main dark:hover:text-white'
                    }`}
                  >
                    최근 30일
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPeriod('month');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className={`h-full px-3 rounded-lg transition-all text-sm font-medium ${
                      selectedPeriod === 'month'
                        ? 'bg-white dark:bg-gray-900 shadow-sm text-text-main dark:text-white'
                        : 'text-text-sub dark:text-gray-400 hover:text-text-main dark:hover:text-white'
                    }`}
                  >
                    이번 달
                  </button>
                </div>
              </div>
            </div>

            {/* 차트 카드 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-6">
              {/* 탭 */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex gap-6">
                  <button
                    onClick={() => setSelectedTab('signup')}
                    className={`relative pb-4 -mb-[17px] font-medium text-base transition-colors ${
                      selectedTab === 'signup'
                        ? 'text-text-main dark:text-white font-bold border-b-2 border-primary'
                        : 'text-text-sub dark:text-gray-400 hover:text-text-main dark:hover:text-white'
                    }`}
                  >
                    가입자 통계
                  </button>
                  <button
                    onClick={() => setSelectedTab('animal')}
                    className={`relative pb-4 -mb-[17px] font-medium text-base transition-colors ${
                      selectedTab === 'animal'
                        ? 'text-text-main dark:text-white font-bold border-b-2 border-primary'
                        : 'text-text-sub dark:text-gray-400 hover:text-text-main dark:hover:text-white'
                    }`}
                  >
                    동물 등록 통계
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-sub dark:text-gray-400">
                  <span className="size-2 rounded-full bg-primary"></span>
                  {selectedTab === 'signup' ? '신규 가입자 수' : '동물 등록 건수'}
                </div>
              </div>

              {/* 차트 */}
              {isLoading ? (
                <div className="h-[320px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : currentStats.length === 0 ? (
                <div className="h-[320px] flex items-center justify-center">
                  <p className="text-text-sub dark:text-gray-400">데이터가 없습니다</p>
                </div>
              ) : (
                <div className="w-full h-[320px] flex flex-col justify-end relative pl-10 pr-4 pb-8 pt-4">
                  {/* Y축 눈금 */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pl-10 pr-4 pt-4 text-xs text-gray-400 font-mono">
                    <div className="w-full border-b border-gray-100 dark:border-gray-800 border-dashed flex items-center">
                      <span className="-ml-8">{maxCount}</span>
                    </div>
                    <div className="w-full border-b border-gray-100 dark:border-gray-800 border-dashed flex items-center">
                      <span className="-ml-8">{Math.floor(maxCount * 0.8)}</span>
                    </div>
                    <div className="w-full border-b border-gray-100 dark:border-gray-800 border-dashed flex items-center">
                      <span className="-ml-8">{Math.floor(maxCount * 0.6)}</span>
                    </div>
                    <div className="w-full border-b border-gray-100 dark:border-gray-800 border-dashed flex items-center">
                      <span className="-ml-8">{Math.floor(maxCount * 0.4)}</span>
                    </div>
                    <div className="w-full border-b border-gray-100 dark:border-gray-800 border-dashed flex items-center">
                      <span className="-ml-8">{Math.floor(maxCount * 0.2)}</span>
                    </div>
                    <div className="w-full border-b border-gray-200 dark:border-gray-700 flex items-center">
                      <span className="-ml-8">0</span>
                    </div>
                  </div>

                  {/* 막대 그래프 */}
                  <div className="relative z-10 flex h-full items-end justify-between gap-2 md:gap-4 pl-2 pr-2">
                    {currentStats.map((stat, index) => {
                      const heightPercent = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;
                      const isToday = index === currentStats.length - 1;

                      return (
                        <div key={stat.date} className="group relative flex-1 flex flex-col justify-end items-center h-full">
                          <div
                            className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 hover:opacity-80 group-hover:scale-y-105 origin-bottom relative ${
                              isToday ? 'bg-primary' : 'bg-primary/30 hover:bg-primary'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-[#111816] text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity pointer-events-none z-20">
                              {stat.count}{selectedTab === 'signup' ? '명' : '건'}
                            </div>
                          </div>
                          <span className={`absolute -bottom-6 text-xs font-medium ${
                            isToday ? 'text-text-main dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {formatShortDate(stat.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 상세 데이터 테이블 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="text-base font-bold text-text-main dark:text-white">상세 데이터</h3>
                <button className="flex items-center gap-1 text-sm font-medium text-text-sub dark:text-gray-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  엑셀 다운로드
                </button>
              </div>

              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-sub dark:text-gray-400">데이터를 불러오는 중...</p>
                  </div>
                ) : paginatedStats.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-text-sub dark:text-gray-400">데이터가 없습니다</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-text-sub dark:text-gray-400 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold w-1/3">날짜</th>
                        <th className="px-6 py-4 font-semibold w-1/3 text-center">
                          {selectedTab === 'signup' ? '신규 가입자 수' : '동물 등록 건수'}
                        </th>
                        <th className="px-6 py-4 font-semibold w-1/3 text-right">전일 대비</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {paginatedStats.map((stat, index) => {
                        const reversedIndex = currentStats.length - 1 - ((currentPage - 1) * itemsPerPage + index);
                        const previousStat = reversedIndex > 0 ? currentStats[reversedIndex - 1] : undefined;
                        const changeRate = calculateChangeRate(stat.count, previousStat?.count);

                        return (
                          <tr
                            key={stat.date}
                            className="border-b border-gray-50 dark:border-gray-800 hover:bg-primary/5 dark:hover:bg-primary/5 transition-colors group"
                          >
                            <td className="px-6 py-4 text-text-main dark:text-white font-medium">
                              {formatDate(stat.date)}
                            </td>
                            <td className="px-6 py-4 text-text-main dark:text-white text-center font-bold">
                              {stat.count}{selectedTab === 'signup' ? '명' : '건'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {changeRate === null ? (
                                <span className="inline-flex items-center gap-1 text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-xs font-bold">
                                  -
                                </span>
                              ) : Number(changeRate) > 0 ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md text-xs font-bold">
                                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                                  +{changeRate}%
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-500 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-md text-xs font-bold">
                                  <span className="material-symbols-outlined text-[14px]">trending_down</span>
                                  {changeRate}%
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-sub dark:text-gray-400 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>

                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`size-8 flex items-center justify-center rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary text-[#0f231e] font-bold shadow-sm'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text-sub dark:text-gray-400 font-medium'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-sub dark:text-gray-400 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
