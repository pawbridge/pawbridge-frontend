import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getMyApplications, submitApplication } from '../../api/shelter.api';
import { useAuthStore } from '../../store/authStore';
import { Status, Pagination, Feedback } from './ShelterUI';
import { control, input, panel, date } from './shelterView';
export default function MyShelterApplications({ role }: { role: string; }) {
  const userId = useAuthStore(s => s.user?.id);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const client = useQueryClient();
  const [page, setPage] = useState(0);
  const [name, setName] = useState('');
  const [resubmit, setResubmit] = useState(false);
  const latest = useQuery({ queryKey: ['shelter', 'mine', userId, 0], queryFn: () => getMyApplications(0), staleTime: 0 });
  const history = useQuery({ queryKey: ['shelter', 'mine', userId, page], queryFn: () => getMyApplications(page), staleTime: 0 });
  const current = latest.data?.content[0];
  const mutation = useMutation({ mutationFn: submitApplication, onSuccess: async () => { setResubmit(false); setPage(0); setName(''); await client.invalidateQueries({ queryKey: ['shelter', 'mine', userId] }); }, onError: () => { void latest.refetch(); } });
  const canSubmit = role === 'ROLE_USER' && !latest.isError && !!latest.data && current?.status !== 'PENDING' && (!current || (current.status === 'REJECTED' && resubmit));
  return <section className="space-y-6 text-gray-800 dark:text-gray-100">
    <h2 className="text-2xl font-bold">보호소 담당자 신청</h2>
    <p>소속 보호소 이름을 알려주시면 관리자가 확인 후 권한을 부여합니다.</p>
    {latest.isPending && <p role="status">신청 상태를 불러오는 중입니다.</p>}{latest.isError && <Feedback error={latest.error} retry={() => void latest.refetch()} />}
    {current && !latest.isError && <div className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold">{current.shelterName}</h3>
        <Status status={current.status} />
      </div>
      <p className="mt-3 text-sm">신청일 {date(current.requestedAt)}</p>{current.status === 'PENDING' && <p className="mt-4">신청을 검토하고 있습니다. 검토 중에는 새 신청을 보낼 수 없습니다.</p>}{current.status === 'REJECTED' && <>
        <h4 className="mt-4 font-bold">반려 사유</h4>
        <p className="mt-2 whitespace-pre-wrap break-words">{current.reason}</p>{role === 'ROLE_USER' && <button className={`${control} mt-4`} onClick={() => { setName(current.shelterName); setResubmit(true); }}>내용 보완하고 다시 신청</button>}</>}{current.status === 'APPROVED' && <>
          <p className="mt-4">승인되었습니다. 권한이 반영되지 않았다면 다시 로그인해 주세요.</p>
          <button className={`${control} mt-4`} onClick={() => { client.removeQueries({ queryKey: ['shelter'] }); logout(); navigate('/login'); }}>다시 로그인하기</button>
        </>}<button className={`${control} mt-4 ml-2`} disabled={latest.isFetching} onClick={() => void client.invalidateQueries({ queryKey: ['shelter', 'mine', userId] })}>상태 새로고침</button>
    </div>}
    {!current && role !== 'ROLE_USER' && latest.data && <p>보호소 담당자 권한이 있거나 신청 대상이 아닌 계정입니다.</p>}
    {canSubmit && <form className={panel} onSubmit={e => { e.preventDefault(); if(name.trim()) mutation.mutate(name.trim()); }}>
      <label htmlFor="shelter-name" className="font-medium">소속 보호소 이름</label>
      <input id="shelter-name" className={input} required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="소속 보호소 이름을 입력하세요" />
      <p className="mt-2 text-sm">등록번호는 관리자가 확인합니다. 이름을 정확히 입력해 주세요.</p>
      <button className={`${control} mt-4 bg-brand text-brand-ink`} disabled={mutation.isPending || !name.trim()}>{mutation.isPending ? '신청 중…' : '담당자 신청하기'}</button>
    </form>}
    {mutation.isError && <Feedback error={mutation.error} />}
    <div className={panel}>
      <h3 className="mb-4 text-xl font-bold">신청 이력</h3>{history.isPending ? <p role="status">이력을 불러오는 중입니다.</p> : history.isError ? <Feedback error={history.error} retry={() => void history.refetch()} /> : <>{history.data.content.length === 0 && <p>아직 신청한 내역이 없습니다.</p>}<ul className="divide-y divide-gray-200">{history.data.content.map(a => <li key={a.id} className="space-y-2 py-4">
        <div className="flex flex-wrap justify-between gap-2">
          <strong>{a.shelterName}</strong>
          <Status status={a.status} />
        </div>
        <p className="text-sm">{date(a.requestedAt)}</p>{a.reason && <p className="whitespace-pre-wrap break-words">반려 사유: {a.reason}</p>}</li>)}</ul>
        <Pagination page={page} total={history.data.totalPages} change={setPage} />
      </>}</div>
  </section>;
}
