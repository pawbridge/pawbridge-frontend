import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getApplications } from '../api/shelter.api';
import type { ApplicationStatus } from '../api/shelter.api';
import { useAuthStore } from '../store/authStore';
import { AdminShelterLayout, Status } from '../components/shelter/ShelterUI';
import { labels, date } from '../components/shelter/shelterView';
import { AdminEmpty, AdminError, AdminLoading, AdminPagination, AdminRecord, adminControl, adminPrimary } from '../components/admin/AdminUI';

export default function AdminShelterApplications() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const id = useAuthStore(state => state.user?.id);
  const requested = params.get('status');
  const status: ApplicationStatus | '' = requested === 'ALL' ? '' : requested === 'APPROVED' || requested === 'REJECTED' ? requested : 'PENDING';
  const rawPage = Number(params.get('page'));
  const page = Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const query = useQuery({ queryKey: ['shelter', 'applications', id, status, page], queryFn: () => getApplications(status, page) });
  return <AdminShelterLayout title="보호소 담당자 신청 관리">
    <p className="text-sm text-brand-muted dark:text-stone-300">신청 정보를 확인한 뒤 보호소 소속을 대조하고 승인해 주세요.</p>
    <div className="flex flex-wrap gap-2" role="group" aria-label="신청 상태">{(['PENDING', 'APPROVED', 'REJECTED', ''] as const).map(value =>
      <button key={value} className={status === value ? adminPrimary : adminControl} aria-pressed={status === value} onClick={() => setParams({ status: value || 'ALL', page: '0' })}>{value ? labels[value] : '전체'}</button>)}</div>
    <p className="text-xs text-brand-muted dark:text-stone-300">현재 조건 · {status ? labels[status] : '전체'}</p>
    {query.isPending ? <AdminLoading label="신청 목록을 불러오는 중입니다." /> : query.isError ? <AdminError title="신청 목록 조회 실패" retry={() => void query.refetch()} /> : <>
      <h2 className="text-sm font-medium">신청 {query.data.totalElements.toLocaleString()}건</h2>
      {!query.data.content.length ? <AdminEmpty title="해당하는 신청이 없습니다." /> : <ul className="space-y-4">{query.data.content.map(({ application, applicantName }) =>
        <AdminRecord key={application.id} title={application.shelterName} description={applicantName} meta={date(application.requestedAt)} status={<Status status={application.status} />}>
          <Link className={adminControl} to={`/admin/shelter-applications/${application.id}${location.search}`}>신청 상세 보기</Link>
        </AdminRecord>)}</ul>}
      <AdminPagination page={page} total={query.data.totalPages} onChange={next => setParams({ status: status || 'ALL', page: String(next) })} />
    </>}
  </AdminShelterLayout>;
}
