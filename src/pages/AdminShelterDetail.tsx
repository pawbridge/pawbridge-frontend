import { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getShelter, getShelterMembers } from '../api/shelter.api';
import { useAuthStore } from '../store/authStore';
import { AdminShelterLayout } from '../components/shelter/ShelterUI';
import { AdminDetailFields, AdminEmpty, AdminError, AdminLoading, AdminPagination, AdminRecord, adminControl, adminPanel } from '../components/admin/AdminUI';

function Detail() {
  const { registration = '' } = useParams();
  const location = useLocation();
  const userId = useAuthStore(state => state.user?.id);
  const [page, setPage] = useState(0);
  const shelter = useQuery({ queryKey: ['shelter', 'detail', registration], queryFn: () => getShelter(registration), enabled: !!registration });
  const members = useQuery({ queryKey: ['shelter', 'members', userId, registration, page], queryFn: () => getShelterMembers(registration, page), enabled: !!shelter.data });
  return <AdminShelterLayout title="보호소 상세">
    <Link className={adminControl} to={`/admin/shelters${location.search}`}>보호소 목록으로</Link>
    {shelter.isPending ? <AdminLoading label="보호소를 불러오는 중입니다." /> : shelter.isError ? <AdminError title="보호소 정보 조회 실패" retry={() => void shelter.refetch()} /> : <>
      <section className={`${adminPanel} space-y-4`}>
        <h2 className="break-words text-[28px] font-bold">{shelter.data.name}</h2>
        <p className="break-all text-sm text-brand-muted dark:text-stone-300">등록번호 {shelter.data.careRegNo}</p>
        <AdminDetailFields fields={[['주소', shelter.data.address], ['관할 기관', shelter.data.organizationName], ['전화번호', shelter.data.phone], ['운영 시간', shelter.data.operatingHours]]} />
      </section>
      <section className={`${adminPanel} space-y-5`}>
        <h2 className="text-xl font-bold">연결된 담당자</h2>
        {members.isPending ? <AdminLoading label="담당자를 불러오는 중입니다." /> : members.isError ? <AdminError title="담당자 목록 조회 실패" retry={() => void members.refetch()} /> : <>
          {!members.data.content.length ? <AdminEmpty title="연결된 담당자가 없습니다."><p className="text-sm text-brand-muted dark:text-stone-300">신청이 승인되면 이곳에 표시됩니다.</p><Link className={adminControl} to="/admin/shelter-applications">담당자 신청 목록 보기</Link></AdminEmpty> : <ul className="space-y-4">{members.data.content.map(member =>
            <AdminRecord key={member.userId} title={member.name} description={member.email} meta="보호소 담당자">
              {member.approvalApplicationId && <Link className={adminControl} to={`/admin/shelter-applications/${member.approvalApplicationId}`}>승인 내역 보기</Link>}
            </AdminRecord>)}</ul>}
          <AdminPagination page={page} total={members.data.totalPages} onChange={setPage} />
        </>}
      </section>
    </>}
  </AdminShelterLayout>;
}
export default function AdminShelterDetail() {
  const params = useParams();
  return <Detail key={params.registration} />;
}
