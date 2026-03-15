import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import {
  getTodayAnimalStats,
  getAnimalStatusStats,
  getRegionalAnimalStats,
} from '../api/animalStats.api';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const TOPO_URL = '/korea-provinces-topo.json';

const TOPO_DISPLAY_MAP: Record<string, string> = {
  '강원도': '강원특별자치도',
  '전라북도': '전북특별자치도',
};

const ALIAS_TO_TOPO: Record<string, string> = {
  '서울': '서울특별시',
  '부산': '부산광역시',
  '대구': '대구광역시',
  '인천': '인천광역시',
  '광주': '광주광역시',
  '대전': '대전광역시',
  '울산': '울산광역시',
  '세종': '세종특별자치시',
  '경기': '경기도',
  '강원': '강원도',
  '강원특별자치도': '강원도',
  '충북': '충청북도',
  '충남': '충청남도',
  '전북': '전라북도',
  '전북특별자치도': '전라북도',
  '전남': '전라남도',
  '경북': '경상북도',
  '경남': '경상남도',
  '제주': '제주특별자치도',
};

type PeriodType = '1day' | '3days' | '7days' | '30days' | 'custom';

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
  const [period, setPeriod] = useState<PeriodType>('1day');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getDateRange = () => {
    const today = new Date();
    const end = getKSTDate(today);
    let start = end;
    switch (period) {
      case '1day':
        start = end;
        break;
      case '3days': {
        const d = new Date(today);
        d.setDate(today.getDate() - 2);
        start = getKSTDate(d);
        break;
      }
      case '7days': {
        const d = new Date(today);
        d.setDate(today.getDate() - 6);
        start = getKSTDate(d);
        break;
      }
      case '30days': {
        const d = new Date(today);
        d.setDate(today.getDate() - 29);
        start = getKSTDate(d);
        break;
      }
      case 'custom':
        break;
    }
    return { start, end };
  };

  const { start: calcStart, end: calcEnd } = getDateRange();
  const isCustomReady = period === 'custom' && !!customStart && !!customEnd;
  const startDate = isCustomReady ? customStart : calcStart;
  const endDate = isCustomReady ? customEnd : calcEnd;
  const shouldFetch = period !== 'custom' || isCustomReady;

  const todayDate = getKSTDate(new Date());

  const { data: todayStats } = useQuery({
    queryKey: ['today-animal-stats'],
    queryFn: getTodayAnimalStats,
  });

  const { data: todayStatusStats = [] } = useQuery({
    queryKey: ['animal-status-stats-today', todayDate],
    queryFn: () => getAnimalStatusStats(todayDate, todayDate),
  });

  const todayEuthanized = todayStatusStats.find((s) => s.status === 'EUTHANIZED')?.count ?? 0;

  const { data: statusStats = [], isLoading: isStatusLoading } = useQuery({
    queryKey: ['animal-status-stats', startDate, endDate],
    queryFn: () => getAnimalStatusStats(startDate, endDate),
    enabled: shouldFetch,
  });

  const { data: regionalStats = [], isLoading: isRegionalLoading } = useQuery({
    queryKey: ['animal-regional-stats', startDate, endDate],
    queryFn: () => getRegionalAnimalStats(startDate, endDate),
    enabled: shouldFetch,
  });

  const statusTotal = statusStats.reduce((sum, s) => sum + s.count, 0);
  const statusMax = statusStats.length > 0 ? Math.max(...statusStats.map((s) => s.count)) : 1;
  const regionalMax = regionalStats.length > 0 ? Math.max(...regionalStats.map((r) => r.count)) : 1;

  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const toTopoName = (name: string) => ALIAS_TO_TOPO[name] ?? name;

  const regionCountMap = useMemo(() => {
    const map = new Map<string, number>();
    regionalStats.forEach((r) => map.set(toTopoName(r.region), r.count));
    return map;
  }, [regionalStats]);

  const getRegionColor = (topoName: string) => {
    const count = regionCountMap.get(topoName) ?? 0;
    if (count === 0) return '#f3f4f6';
    const ratio = regionalMax > 0 ? count / regionalMax : 0;
    const lightness = Math.round(85 - ratio * 55);
    return `hsl(0, 0%, ${lightness}%)`;
  };

  const getDisplayName = (topoName: string) => TOPO_DISPLAY_MAP[topoName] ?? topoName;

  const periodButtons: { key: PeriodType; label: string }[] = [
    { key: '1day', label: '1일' },
    { key: '3days', label: '3일' },
    { key: '7days', label: '7일' },
    { key: '30days', label: '30일' },
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
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              유기동물 현황을 한눈에 확인하고, 입양에 관심을 가져주세요.
            </p>
          </div>

          {/* 오늘의 통계 요약 */}
          <section className="mb-10">
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-light dark:divide-border-dark">
                <div className="px-6 py-5 text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">오늘 구조</p>
                  <p className="text-3xl font-black text-text-light dark:text-text-dark tracking-tight">
                    {todayStats?.rescuedToday ?? '—'}
                    <span className="text-sm font-medium text-gray-400 ml-1">마리</span>
                  </p>
                </div>
                <div className="px-6 py-5 text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">오늘 입양</p>
                  <p className="text-3xl font-black text-text-light dark:text-text-dark tracking-tight">
                    {todayStats?.adoptedToday ?? '—'}
                    <span className="text-sm font-medium text-gray-400 ml-1">마리</span>
                  </p>
                </div>
                <div className="px-6 py-5 text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">오늘 안락사</p>
                  <p className="text-3xl font-black text-text-light dark:text-text-dark tracking-tight">
                    {todayEuthanized}
                    <span className="text-sm font-medium text-gray-400 ml-1">마리</span>
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
              {todayStats?.date ? todayStats.date.replace(/-/g, '.') + ' 기준' : ''}
            </p>
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

          {/* 직접선택 시 날짜 미입력 안내 */}
          {period === 'custom' && !isCustomReady && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm mb-8">
              시작일과 종료일을 모두 선택해주세요.
            </div>
          )}

          {/* 상태별 현황 */}
          {shouldFetch && (
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
                      return (
                        <div key={stat.status} className="flex items-center gap-4 px-5 py-4">
                          <span className="text-sm font-semibold text-text-light dark:text-text-dark w-24 flex-shrink-0">
                            {stat.label}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="w-full h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gray-800 dark:bg-gray-300 transition-all duration-500"
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
          )}

          {/* 지역별 구조 통계 */}
          {shouldFetch && (
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 지도 */}
                  <div className="relative bg-white dark:bg-gray-900 rounded-xl border border-border-light dark:border-border-dark shadow-sm p-4">
                    {hoveredRegion && (
                      <div
                        className="pointer-events-none absolute z-10 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 text-xs font-semibold shadow-lg"
                        style={{ left: tooltipPos.x, top: tooltipPos.y, transform: 'translate(-50%, -120%)' }}
                      >
                        {getDisplayName(hoveredRegion)} · {regionCountMap.get(hoveredRegion)?.toLocaleString() ?? 0}건
                      </div>
                    )}
                    <ComposableMap
                      projection="geoMercator"
                      projectionConfig={{ center: [127.8, 36.0], scale: 4800 }}
                      width={500}
                      height={600}
                      style={{ width: '100%', height: 'auto' }}
                    >
                      <Geographies geography={TOPO_URL} parseGeographies={(geos) =>
                        geos.filter((g) => g.properties.code !== '39')
                      }>
                        {({ geographies }) =>
                          geographies.map((geo) => {
                            const topoName = geo.properties.name as string;
                            return (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={getRegionColor(topoName)}
                                stroke="#d1d5db"
                                strokeWidth={0.8}
                                onMouseEnter={(e) => {
                                  const container = (e.target as SVGElement).closest('svg')!.parentElement!;
                                  const rect = container.getBoundingClientRect();
                                  setHoveredRegion(topoName);
                                  setTooltipPos({
                                    x: e.clientX - rect.left,
                                    y: e.clientY - rect.top,
                                  });
                                }}
                                onMouseMove={(e) => {
                                  const container = (e.target as SVGElement).closest('svg')!.parentElement!;
                                  const rect = container.getBoundingClientRect();
                                  setTooltipPos({
                                    x: e.clientX - rect.left,
                                    y: e.clientY - rect.top,
                                  });
                                }}
                                onMouseLeave={() => setHoveredRegion(null)}
                                style={{
                                  default: { outline: 'none', cursor: 'pointer' },
                                  hover: { outline: 'none', fill: '#6b7280', cursor: 'pointer' },
                                  pressed: { outline: 'none' },
                                }}
                              />
                            );
                          })
                        }
                      </Geographies>
                      <Geographies geography={TOPO_URL} parseGeographies={(geos) =>
                        geos.filter((g) => g.properties.code === '39')
                      }>
                        {({ geographies }) =>
                          geographies.map((geo) => {
                            const topoName = geo.properties.name as string;
                            return (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={getRegionColor(topoName)}
                                stroke="#d1d5db"
                                strokeWidth={0.8}
                                onMouseEnter={(e) => {
                                  const container = (e.target as SVGElement).closest('svg')!.parentElement!;
                                  const rect = container.getBoundingClientRect();
                                  setHoveredRegion(topoName);
                                  setTooltipPos({
                                    x: e.clientX - rect.left,
                                    y: e.clientY - rect.top,
                                  });
                                }}
                                onMouseMove={(e) => {
                                  const container = (e.target as SVGElement).closest('svg')!.parentElement!;
                                  const rect = container.getBoundingClientRect();
                                  setTooltipPos({
                                    x: e.clientX - rect.left,
                                    y: e.clientY - rect.top,
                                  });
                                }}
                                onMouseLeave={() => setHoveredRegion(null)}
                                style={{
                                  default: { outline: 'none', cursor: 'pointer' },
                                  hover: { outline: 'none', fill: '#6b7280', cursor: 'pointer' },
                                  pressed: { outline: 'none' },
                                }}
                              />
                            );
                          })
                        }
                      </Geographies>
                    </ComposableMap>
                    <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm" style={{ background: '#f3f4f6' }} />
                        <span>0</span>
                      </div>
                      <div className="w-16 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #d4d4d4, #333333)' }} />
                      <span>{regionalMax.toLocaleString()}건</span>
                    </div>
                  </div>

                  {/* 막대 그래프 */}
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
                    <div className="divide-y divide-border-light dark:divide-border-dark">
                      {regionalStats.map((region, idx) => {
                        const barWidth = regionalMax > 0 ? (region.count / regionalMax) * 100 : 0;
                        const rank = idx === 0 || region.count !== regionalStats[idx - 1].count
                          ? idx + 1
                          : regionalStats.findIndex((r) => r.count === region.count) + 1;
                        const displayRegion = getDisplayName(toTopoName(region.region));
                        return (
                          <div key={region.region} className="flex items-center gap-4 px-5 py-3.5">
                            <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-6 text-right flex-shrink-0">
                              {rank}
                            </span>
                            <span className="text-sm font-semibold text-text-light dark:text-text-dark w-28 flex-shrink-0">
                              {displayRegion}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="w-full h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gray-800 dark:bg-gray-300 transition-all duration-500"
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
                </div>
              )}
            </section>
          )}

          {/* 하단 안내 */}
          <div className="text-center py-8">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              통계는 공공데이터 기반으로 제공되며, 실시간 데이터와 차이가 있을 수 있습니다.
            </p>
            <Link
              to="/animals"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-content rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
            >
              입양 가능한 동물 보러가기
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
