import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVisitPeriod } from '../../api/visits.api';
import AdminTrend from '../admin/AdminTrend';
import { AdminError, AdminLoading, AdminPagination, adminPanel } from '../admin/AdminUI';
import { kstToday, shiftDay } from '../../lib/adminStatistics';

export default function AdminVisitStatistics({ start, end }: { start: string; end: string }) {
  const [page, setPage] = useState(0);
  const query = useQuery({ queryKey: ['admin-visit-statistics', start, end],
    queryFn: () => getVisitPeriod(start, end), retry: false });
  if (query.isPending) return <AdminLoading label="방문 통계를 불러오는 중입니다." />;
  if (query.isError) return <AdminError title="방문 통계 조회 실패" retry={() => void query.refetch()} />;
  const { daily, today, collectionStartedAt } = query.data;
  const began = kstToday(new Date(collectionStartedAt));
  const complete = daily.filter(row => row.date !== today && row.date !== began);
  const labels = [
    ['오늘 방문', daily.find(row => row.date === today)?.count, '오늘을 선택한 경우 표시하며 집계 중입니다.'],
    ['어제 방문', daily.find(row => row.date === shiftDay(today, -1))?.count, '어제를 선택한 경우 표시합니다.'],
    ['완료일 일평균', complete.length ? Math.round(complete.reduce((sum, row) => sum + row.count, 0) / complete.length * 10) / 10 : undefined,
      '오늘과 최초 시작일을 제외한 평균'],
  ] as const;
  return <>
    <div className="grid gap-4 sm:grid-cols-3">{labels.map(([label, value, caption]) =>
      <section key={label} className={`${adminPanel} space-y-3`} aria-label={label}>
        <h2 className="text-sm text-brand-muted dark:text-stone-300">{label}</h2>
        <p className="text-[28px] font-bold tabular-nums">{value === undefined ? '—' : value.toLocaleString()}</p>
        <p className="text-xs text-brand-muted dark:text-stone-300">{caption}</p>
      </section>)}</div>
    {daily.length ? <AdminTrend title="일별 방문 추이" rows={daily} unit="" totalLabel="일별 합계" />
      : <section className={adminPanel}><p>선택한 기간에는 집계된 날짜가 없습니다.</p></section>}
    <section className={`${adminPanel} space-y-4`}>
      <h2 className="text-xl font-bold">날짜별 상세</h2>
      {[...daily].reverse().slice(page * 7, (page + 1) * 7).map(row =>
        <div key={row.date} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,.6fr)_minmax(0,1fr)] items-center gap-2 rounded-lg border border-brand-border p-4 text-sm sm:grid-cols-3 dark:border-stone-700">
          <span>{row.date}</span><span className="tabular-nums">{row.count.toLocaleString()}</span>
          <span className="text-xs text-brand-muted dark:text-stone-300">{row.date === today ? '집계 중' : row.date === began ? '집계 시작일 일부' : '완료'}</span>
        </div>)}
      <AdminPagination page={page} total={Math.ceil(daily.length / 7)} onChange={setPage} />
    </section>
    <section className={`${adminPanel} space-y-3 text-sm`}>
      <h2 className="text-xl font-bold">집계 기준</h2>
      <p>한국 시간 하루 기준으로 같은 브라우저를 한 번 집계합니다. 로그인 전후에도 같은 기준입니다.</p>
      <p>집계 시작: {new Date(collectionStartedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}. 그 이전 날짜는 0으로 채우지 않습니다.</p>
      <p className="text-brand-muted dark:text-stone-300">알려진 봇, 관리자 페이지, 개발 환경과 상태 확인 요청은 제외합니다. 다른 기기, 시크릿 모드와 쿠키 삭제는 별도 방문으로 집계될 수 있으며 모든 AI를 구분할 수는 없습니다.</p>
      <p className="text-brand-muted dark:text-stone-300">일별 합계는 기간 전체의 중복을 제외한 사람 수가 아닙니다.</p>
    </section>
  </>;
}
