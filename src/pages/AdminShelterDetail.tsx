import { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getShelter, getShelterMembers } from '../api/shelter.api';
import { useAuthStore } from '../store/authStore';
import { AdminShelterLayout, Feedback, Pagination } from '../components/shelter/ShelterUI';
import { control, panel } from '../components/shelter/shelterView';
function Detail() {
  const { registration = '' } = useParams();
  const location = useLocation();
  const userId = useAuthStore(s => s.user?.id);
  const [page, setPage] = useState(0);
  const shelter = useQuery({ queryKey: ['shelter', 'detail', registration], queryFn: () => getShelter(registration), enabled: !!registration });
  const members = useQuery({ queryKey: ['shelter', 'members', userId, registration, page], queryFn: () => getShelterMembers(registration, page), enabled: !!shelter.data });
  return <AdminShelterLayout title="보호소 상세">
    <Link className="inline-block underline" to={`/admin/shelters${location.search}`}>← 보호소 목록으로</Link>{shelter.isPending ? <p role="status">보호소를 불러오는 중입니다.</p> : shelter.isError ? <Feedback error={shelter.error} retry={() => void shelter.refetch()} /> : <>
      <section className={panel}>
        <h2 className="text-xl font-bold">{shelter.data.name}</h2>
        <p className="my-4 break-all">등록번호 {shelter.data.careRegNo}</p>
        <dl className="grid gap-5 sm:grid-cols-2">{[['주소', shelter.data.address], ['관할 기관', shelter.data.organizationName], ['전화번호', shelter.data.phone], ['운영 시간', shelter.data.operatingHours]].map(([k, v]) =>
          <div key={k}>
            <dt className="text-sm text-gray-600 dark:text-gray-400">{k}</dt>
            <dd className="mt-2">{v || '미등록'}</dd>
          </div>)}</dl>
      </section>
      <section className={panel}>
        <h2 className="mb-4 text-xl font-bold">연결된 담당자</h2>{members.isPending ? <p role="status">담당자를 불러오는 중입니다.</p> : members.isError ? <Feedback error={members.error} retry={() => void members.refetch()} /> : <>{members.data.content.length === 0 ? <>
          <p>연결된 담당자가 없습니다. 신청이 승인되면 이곳에 표시됩니다.</p>
          <Link className={`${control} mt-4 inline-block`} to="/admin/shelter-applications">담당자 신청 목록 보기</Link>
        </> : <ul className="divide-y divide-gray-200">{members.data.content.map(m =>
          <li key={m.userId} className="space-y-2 py-4">
            <strong>{m.name}</strong>
            <p className="break-all">{m.email}</p>
            <p>보호소 담당자</p>{m.approvalApplicationId && <Link className={`${control} inline-block`} to={`/admin/shelter-applications/${m.approvalApplicationId}`}>승인 내역 보기</Link>}</li>)}</ul>}<Pagination page={page} total={members.data.totalPages} change={setPage} />
        </>}</section>
    </>}</AdminShelterLayout>;
}

export default function AdminShelterDetail() {
  const params = useParams();
  return <Detail key={params.id ?? params.registration} />;
}
