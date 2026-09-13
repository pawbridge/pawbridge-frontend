import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getShelters } from '../api/shelter.api';
import { AdminShelterLayout, Feedback, Pagination } from '../components/shelter/ShelterUI';
import { control, input, panel } from '../components/shelter/shelterView';
function ShelterList() {
  const [params, setParams] = useSearchParams();
  const keyword = params.get('keyword') || '';
  const [draft, setDraft] = useState(keyword);
  const raw = Number(params.get('page'));
  const page = Number.isInteger(raw) && raw >= 0 ? raw : 0;
  const q = useQuery({ queryKey: ['shelter', 'list', keyword, page], queryFn: () => getShelters(keyword, page) });
  return <AdminShelterLayout title="보호소 목록">
    <p>보호소 이름이나 주소로 검색하고 상세 정보를 확인하세요.</p>
    <form className={`${panel} flex flex-col items-end gap-4 sm:flex-row`} onSubmit={e => { e.preventDefault(); setParams({ keyword: draft.trim(), page: '0' }); }}>
      <label htmlFor="shelter-search" className="w-full">보호소 검색<input id="shelter-search" className={input} value={draft} onChange={e => setDraft(e.target.value)} placeholder="보호소 이름 또는 주소 입력" maxLength={100} />
      </label>
      <button className={`${control} w-full sm:w-32 shrink-0`}>검색</button>
    </form>{q.isPending ? <p role="status">보호소를 불러오는 중입니다.</p> : q.isError ? <Feedback error={q.error} retry={() => void q.refetch()} /> : <section className={panel}>
      <h2 className="mb-4 font-bold">보호소 {q.data.totalElements.toLocaleString()}곳</h2>{q.data.content.length === 0 ? <>
        <p>검색 결과가 없습니다.</p>
        <button className={`${control} mt-3`} onClick={() => { setDraft(''); setParams({}); }}>전체 보호소 보기</button>
      </> : <ul className="divide-y divide-gray-200">{q.data.content.map(s =>
        <li key={s.id} className="grid gap-3 py-5 md:grid-cols-[1fr_1fr_2fr_auto]">
          <strong>{s.name}</strong>
          <span className="break-all">{s.careRegNo}</span>
          <span>{s.address || '주소 미등록'}</span>
          <Link className={control} to={`/admin/shelters/${encodeURIComponent(s.careRegNo)}?${params.toString()}`}>상세 보기</Link>
        </li>)}</ul>}<Pagination page={page} total={q.data.totalPages} change={p => setParams({ keyword, page: String(p) })} />
    </section>}</AdminShelterLayout>;
}

export default function AdminShelters() {
  const [params] = useSearchParams();
  return <ShelterList key={params.toString()} />;
}
