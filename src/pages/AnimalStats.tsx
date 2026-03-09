import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getTodayAnimalStats,
  getAnimalStatusStats,
  getRegionalAnimalStats,
} from '../api/animalStats.api';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

type PeriodType = '30days' | '90days' | '180days' | 'custom';

const STATUS_COLORS: Record<string, { bg: string; bar: string }> = {
  PROTECT: { bg: 'bg-green-100 dark:bg-green-900/30', bar: 'bg-green-500' },
  ADOPTED: { bg: 'bg-blue-100 dark:bg-blue-900/30', bar: 'bg-blue-500' },
  NATURAL_DEATH: { bg: 'bg-gray-200 dark:bg-gray-700', bar: 'bg-gray-500' },
  RETURNED: { bg: 'bg-purple-100 dark:bg-purple-900/30', bar: 'bg-purple-500' },
  EUTHANIZED: { bg: 'bg-red-100 dark:bg-red-900/30', bar: 'bg-red-500' },
  DONATED: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', bar: 'bg-yellow-500' },
  RELEASED: { bg: 'bg-teal-100 dark:bg-teal-900/30', bar: 'bg-teal-500' },
};

function getKSTDate(date: Date): string {
  const kstOffset = 9 * 60;
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const kstDate = new Date(utc + kstOffset * 60000);
  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AnimalStats() {
  const [period, setPeriod] = useState<PeriodType>('30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getDateRange = () => {
    const today = new Date();
    const end = getKSTDate(today);
    let start = end;
    switch (period) {
      case '30days': {
        const d = new Date(today);
        d.setDate(today.getDate() - 29);
        start = getKSTDate(d);
        break;
      }
      case '90days': {
        const d = new Date(today);
        d.setDate(today.getDate() - 89);
        start = getKSTDate(d);
        break;
      }
      case '180days': {
        const d = new Date(today);
        d.setDate(today.getDate() - 179);
        start = getKSTDate(d);
        break;
      }
      case 'custom':
        break;
    }
    return { start, end };
  };

  const { start: calcStart, end: calcEnd } = getDateRange();
  const startDate = period === 'custom' && customStart ? customStart : calcStart;
  const endDate = period === 'custom' && customEnd ? customEnd : calcEnd;

  const { data: todayStats } = useQuery({
    queryKey: ['today-animal-stats'],
    queryFn: getTodayAnimalStats,
  });

  const { data: statusStats = [], isLoading: isStatusLoading } = useQuery({
    queryKey: ['animal-status-stats', startDate, endDate],
    queryFn: () => getAnimalStatusStats(startDate, endDate),
  });

  const { data: regionalStats = [], isLoading: isRegionalLoading } = useQuery({
    queryKey: ['animal-regional-stats', startDate, endDate],
    queryFn: () => getRegionalAnimalStats(startDate, endDate),
  });

  const statusTotal = statusStats.reduce((sum, s) => sum + s.count, 0);
  const statusMax = statusStats.length > 0 ? Math.max(...statusStats.map((s) => s.count)) : 1;
  const regionalMax = regionalStats.length > 0 ? Math.max(...regionalStats.map((r) => r.count)) : 1;

  const periodButtons: { key: PeriodType; label: string }[] = [
    { key: '30days', label: '최근 30일' },
    { key: '90days', label: '최근 90일' },
    { key: '180days', label: '최근 180일' },
    { key: 'custom', label: '직접 선택' },
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <Header />

      <main className="flex flex-col items-center w-full">
        <div className="flex flex-col max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          {/* 페이지 헤더 */}
          <div className="mb-10">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <Link to="/" className="hover:text-primary transition-colors">홈</Link>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-text-light dark:text-text-dark font-medium">유기동물 통계</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-text-light dark:text-text-dark tracking-tight">
              유기동물 통계
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              유기동물 현황을 한눈에 확인하고, 입양에 관심을 가져주세요.
            </p>
          </div>

          {/* 오늘의 통계 요약 */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 p-5 text-center">
              <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-1">오늘 구조</p>
              <p className="text-3xl font-black text-blue-700 dark:text-blue-300">
                {todayStats?.rescuedToday ?? '—'}
                <span className="text-sm font-semibold text-blue-500/70 ml-1">마리</span>
              </p>
            </div>
            <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200/60 dark:border-green-800/40 p-5 text-center">
              <p className="text-xs font-semibold text-green-500 dark:text-green-400 mb-1">오늘 입양</p>
              <p className="text-3xl font-black text-green-700 dark:text-green-300">
                {todayStats?.adoptedToday ?? '—'}
                <span className="text-sm font-semibold text-green-500/70 ml-1">마리</span>
              </p>
            </div>
            <div className="rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-800/40 p-5 text-center">
              <p className="text-xs font-semibold text-orange-500 dark:text-orange-400 mb-1">
                {todayStats?.date ? todayStats.date.replace(/-/g, '.') : '—'}
              </p>
              <p className="text-sm font-bold text-orange-700 dark:text-orange-300 mt-1">
                따뜻한 가족을 기다리는<br />아이들이 있습니다
              </p>
            </div>
          </section>

          {/* 기간 필터 */}
          <div className="flex flex-wrap items-end gap-3 mb-8">
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 gap-1">
              {periodButtons.map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setPeriod(btn.key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                    period === btn.key
                      ? 'bg-white dark:bg-gray-700 text-text-light dark:text-text-dark shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-text-light dark:hover:text-text-dark'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 h-9 w-36 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-gray-400">~</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 h-9 w-36 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}
          </div>

          {/* 상태별 현황 */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-text-light dark:text-text-dark">상태별 현황</h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {startDate} ~ {endDate} · 총 {statusTotal.toLocaleString()}건
              </span>
            </div>

            {isStatusLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                불러오는 중...
              </div>
            ) : statusStats.length === 0 ? (
              <div className="text-center py-16 text-gray-400">데이터가 없습니다.</div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
                <div className="divide-y divide-border-light dark:divide-border-dark">
                  {statusStats.map((stat) => {
                    const pct = statusTotal > 0 ? ((stat.count / statusTotal) * 100).toFixed(1) : '0';
                    const barWidth = statusMax > 0 ? (stat.count / statusMax) * 100 : 0;
                    const colors = STATUS_COLORS[stat.status] || { bg: 'bg-gray-100 dark:bg-gray-800', bar: 'bg-gray-400' };
                    return (
                      <div key={stat.status} className="flex items-center gap-4 px-5 py-4">
                        <span className={`text-xs font-bold rounded-full px-3 py-1 whitespace-nowrap ${colors.bg} text-gray-700 dark:text-gray-300`}>
                          {stat.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="w-full h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2 flex-shrink-0 w-32 justify-end">
                          <span className="text-lg font-black text-text-light dark:text-text-dark">
                            {stat.count.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* 지역별 구조 통계 */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-text-light dark:text-text-dark">지역별 구조 통계</h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {startDate} ~ {endDate}
              </span>
            </div>

            {isRegionalLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                불러오는 중...
              </div>
            ) : regionalStats.length === 0 ? (
              <div className="text-center py-16 text-gray-400">데이터가 없습니다.</div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
                <div className="divide-y divide-border-light dark:divide-border-dark">
                  {regionalStats.map((region, idx) => {
                    const barWidth = regionalMax > 0 ? (region.count / regionalMax) * 100 : 0;
                    return (
                      <div key={region.region} className="flex items-center gap-4 px-5 py-3.5">
                        <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-6 text-right">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-text-light dark:text-text-dark w-20 flex-shrink-0">
                          {region.region}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="w-full h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary/80 transition-all duration-500"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-bold text-text-light dark:text-text-dark flex-shrink-0 w-20 text-right">
                          {region.count.toLocaleString()}건
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* 하단 안내 */}
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              이 통계는 공공데이터 기반으로 제공되며, 실시간 데이터와 차이가 있을 수 있습니다.
            </p>
            <Link
              to="/animals"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-content rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-lg">pets</span>
              입양 가능한 동물 보러가기
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
