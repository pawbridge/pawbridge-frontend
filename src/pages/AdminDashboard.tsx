import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import { getTotalUserCount, getDailySignupStats, getDailyAnimalStats, getTodayPostCount } from '../api/stats.api';
import { AdminError, AdminLoading, adminControl, adminPanel, adminPrimary } from '../components/admin/AdminUI';
import AdminTrend from '../components/admin/AdminTrend';
import { fillAdminDays, kstToday, shiftDay } from '../lib/adminStatistics';

export default function AdminDashboard() {
  const today = kstToday();
  const start = shiftDay(today, -6);
  const members = useQuery({ queryKey: ['admin-stats', 'total-users'], queryFn: getTotalUserCount });
  const signup = useQuery({ queryKey: ['admin-stats', 'daily-signups', start, today], queryFn: () => getDailySignupStats(start, today) });
  const animals = useQuery({ queryKey: ['admin-stats', 'daily-animals', today], queryFn: () => getDailyAnimalStats(today, today) });
  const posts = useQuery({ queryKey: ['admin-stats', 'today-posts'], queryFn: getTodayPostCount });
  const todayCount = (data: { date: string; count: number }[] | undefined) => data?.find(row => row.date.slice(0, 10) === today)?.count ?? 0;
  const metrics = [
    { title: '현재 회원', value: members.data, description: '현재 남아 있는 가입 회원', query: members },
    { title: '오늘 가입', value: todayCount(signup.data), description: '오늘 신규 회원', query: signup },
    { title: '오늘 신규 수집', value: todayCount(animals.data), description: '시스템 최초 저장 기준 · 접수 건수 아님', query: animals },
    { title: '오늘 게시글', value: posts.data, description: '오늘 작성된 미삭제 게시글', query: posts },
  ];
  return <AdminLayout title="대시보드" description="회원과 서비스 운영 현황을 확인하세요.">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(metric =>
      <section key={metric.title} className={`${adminPanel} min-h-40 space-y-3`} aria-label={metric.title}>
        <h2 className="text-sm font-medium text-brand-muted dark:text-stone-300">{metric.title}</h2>
        {metric.query.isPending ? <p role="status" className="text-sm">불러오는 중…</p> : metric.query.isError ? <div role="alert"><p className="text-sm">조회 실패</p><button className={`${adminControl} mt-2`} onClick={() => void metric.query.refetch()}>다시 불러오기</button></div> : <p className="text-[28px] font-bold leading-[42px]">{metric.value?.toLocaleString()}</p>}
        <p className="text-xs text-brand-muted dark:text-stone-300">{metric.description}</p>
      </section>)}</div>
    {signup.isPending ? <AdminLoading label="회원 가입 추이를 불러오는 중입니다." /> : signup.isError ? <AdminError title="회원 가입 추이 조회 실패" retry={() => void signup.refetch()} /> : <AdminTrend title="회원 가입 추이" rows={fillAdminDays(signup.data, start, today)} unit="명" />}
    <section className={`${adminPanel} space-y-4`}><h2 className="text-xl font-bold">관리 바로가기</h2><p className="text-sm text-brand-muted dark:text-stone-300">회원·보호소·게시글을 빠르게 확인하세요.</p><div className="flex flex-wrap gap-3"><Link className={adminPrimary} to="/admin/users">회원 관리</Link><Link className={adminControl} to="/admin/shelters">보호소 목록</Link><Link className={adminControl} to="/admin/posts">게시글 관리</Link></div></section>
  </AdminLayout>;
}

