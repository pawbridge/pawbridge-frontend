import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getApplications } from '../api/shelter.api';
import type { ApplicationStatus } from '../api/shelter.api';
import { useAuthStore } from '../store/authStore';
import { AdminShelterLayout, Status, Pagination, Feedback } from '../components/shelter/ShelterUI';
import { control, panel, labels, date } from '../components/shelter/shelterView';
export default function AdminShelterApplications() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const id = useAuthStore(s => s.user?.id);
  const requested = params.get('status');
  const status: ApplicationStatus | '' = requested === 'ALL' ? '' : requested === 'APPROVED' || requested === 'REJECTED' ? requested : 'PENDING';
  const rawPage = Number(params.get('page'));
  const page = Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const query = useQuery({ queryKey: ['shelter', 'applications', id, status, page], queryFn: () => getApplications(status, page) });
  return <AdminShelterLayout title="보호소 담당자 신청 관리">
    <p>신청 정보를 확인한 뒤 보호소를 연결하고 승인해 주세요.</p>
    <div className="flex flex-wrap gap-2" role="group" aria-label="신청 상태">{(['PENDING', 'APPROVED', 'REJECTED', ''] as const).map(s =>
      <button key={s} className={`${control} ${status === s ? 'bg-gray-100 border-gray-600' : ''}`} aria-pressed={status === s} onClick={() => setParams({ status: s || 'ALL', page: '0' })}>{s ? labels[s] : '전체'}</button>)}</div>{query.isPending ? <p role="status">신청 목록을 불러오는 중입니다.</p> : query.isError ? <Feedback error={query.error} retry={() => void query.refetch()} /> : <div className={panel}>{query.data.content.length === 0 ? <p>해당하는 신청이 없습니다.</p> : <ul className="divide-y divide-gray-200">{query.data.content.map(({ application: a, applicantName }) =>
        <li key={a.id} className="grid items-center gap-3 py-5 md:grid-cols-[2fr_1fr_1fr_auto]">
          <div>
            <strong className="break-words">{a.shelterName}</strong>
            <p className="mt-1 text-sm">{applicantName}</p>
          </div>
          <span className="text-sm">{date(a.requestedAt)}</span>
          <div>
            <Status status={a.status} />
          </div>
          <Link className={control} to={`/admin/shelter-applications/${a.id}${location.search}`}>신청 상세 보기</Link>
        </li>)}</ul>}<Pagination page={page} total={query.data.totalPages} change={p => setParams({ status: status || 'ALL', page: String(p) })} />
      </div>}</AdminShelterLayout>;
}
