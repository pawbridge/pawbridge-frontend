import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getShelters } from '../api/shelter.api';
import { AdminShelterLayout } from '../components/shelter/ShelterUI';
import { AdminEmpty, AdminError, AdminLoading, AdminPagination, AdminRecord, adminControl, adminInput, adminPanel, adminPrimary } from '../components/admin/AdminUI';

function ShelterList() {
  const [params, setParams] = useSearchParams();
  const keyword = params.get('keyword') || '';
  const [draft, setDraft] = useState(keyword);
  const raw = Number(params.get('page'));
  const page = Number.isInteger(raw) && raw >= 0 ? raw : 0;
  const query = useQuery({ queryKey: ['shelter', 'list', keyword, page], queryFn: () => getShelters(keyword, page) });
  return <AdminShelterLayout title="보호소 목록">
    <p className="text-sm text-brand-muted dark:text-stone-300">보호소 이름이나 주소로 검색하고 상세 정보를 확인하세요.</p>
    <form className={`${adminPanel} flex flex-col items-end gap-4 sm:flex-row`} onSubmit={event => { event.preventDefault(); setParams({ keyword: draft.trim(), page: '0' }); }}>
      <label htmlFor="shelter-search" className="w-full text-sm font-medium">보호소 검색<input id="shelter-search" className={adminInput} value={draft} onChange={event => setDraft(event.target.value)} placeholder="보호소 이름 또는 주소 입력" maxLength={100} /></label>
      <button className={`${adminPrimary} w-full shrink-0 sm:w-auto`}>검색</button>
    </form>
    {query.isPending ? <AdminLoading label="보호소 목록을 불러오는 중입니다." /> : query.isError ? <AdminError title="보호소 목록 조회 실패" retry={() => void query.refetch()} /> : <>
      <h2 className="text-sm font-medium">검색 결과 · 보호소 {query.data.totalElements.toLocaleString()}곳</h2>
      {query.data.content.length === 0 ? <AdminEmpty title="검색 결과가 없습니다."><button className={adminControl} onClick={() => { setDraft(''); setParams({}); }}>전체 보호소 보기</button></AdminEmpty> : <ul className="space-y-4">{query.data.content.map(shelter =>
        <AdminRecord key={shelter.id} title={shelter.name} description={shelter.address || '주소 미등록'} meta={`등록번호 ${shelter.careRegNo}`}>
          <Link className={adminControl} to={`/admin/shelters/${encodeURIComponent(shelter.careRegNo)}?${params.toString()}`}>상세 보기</Link>
        </AdminRecord>)}</ul>}
      <AdminPagination page={page} total={query.data.totalPages} onChange={next => setParams({ keyword, page: String(next) })} />
    </>}
  </AdminShelterLayout>;
}
export default function AdminShelters() {
  const [params] = useSearchParams();
  return <ShelterList key={params.toString()} />;
}
