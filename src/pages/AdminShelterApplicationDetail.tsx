import { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApplication, approveApplication, rejectApplication } from '../api/shelter.api';
import { useAuthStore } from '../store/authStore';
import { AdminShelterLayout, Status, Feedback } from '../components/shelter/ShelterUI';
import { control, input, panel, date } from '../components/shelter/shelterView';
function Detail() {
  const { id } = useParams();
  const userId = useAuthStore(s => s.user?.id);
  const location = useLocation();
  const client = useQueryClient();
  const [registration, setRegistration] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<'approve' | 'reject' | null>(null);
  const query = useQuery({ queryKey: ['shelter', 'application', userId, id], queryFn: () => getApplication(Number(id)), enabled: /^\d+$/.test(id || '') });
  const mutation = useMutation({ mutationFn: async (action: 'approve' | 'reject') => action === 'approve' ? approveApplication(Number(id), registration.trim(), note.trim()) : rejectApplication(Number(id), reason.trim()), onSuccess: async (data) => { client.setQueryData(['shelter', 'application', userId, id], data); setMode(null); await client.invalidateQueries({ queryKey: ['shelter'] }); }, onError: () => { void query.refetch(); } });
  const a = query.data?.application;
  return <AdminShelterLayout title="담당자 신청 상세">
    <Link className="inline-block underline" to={`/admin/shelter-applications${location.search}`}>← 신청 목록으로</Link>{!/^\d+$/.test(id || '') ? <p>잘못된 신청 주소입니다.</p> : query.isPending ? <p role="status">신청을 불러오는 중입니다.</p> : query.isError ? <Feedback error={query.error} retry={() => void query.refetch()} /> : a && <>
      <div className={`${panel} flex flex-wrap items-center justify-between gap-3`}>
        <h2 className="text-xl font-bold break-words">{a.shelterName}</h2>
        <Status status={a.status} />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(260px,1fr)_2fr]">
        <section className={panel}>
          <h2 className="mb-5 text-lg font-bold">신청 정보</h2>
          <dl className="space-y-4">
            <div>
              <dt>신청자</dt>
              <dd className="mt-1 font-medium">{query.data.applicantName}</dd>
            </div>
            <div>
              <dt>이메일</dt>
              <dd className="mt-1 break-all">{query.data.applicantEmail || '—'}</dd>
            </div>
            <div>
              <dt>신청일</dt>
              <dd className="mt-1">{date(a.requestedAt)}</dd>
            </div>
          </dl>
          <p className="mt-5 text-sm">신청자가 입력한 보호소 이름입니다. 실제 소속 여부는 별도로 확인해 주세요.</p>
        </section>
        {a.status === 'PENDING' ? <section className={panel}>
          <h2 className="text-lg font-bold">보호소 확인</h2>
          <p className="my-3">소속을 확인한 보호소의 등록번호를 입력해 주세요.</p>
          <Link className="underline" to="/admin/shelters" target="_blank" rel="noreferrer">보호소 목록에서 확인 (새 탭)</Link>
          <form className="mt-5 space-y-4" onSubmit={e => { e.preventDefault(); if(registration.trim() && note.trim()) setMode('approve'); }}>
            <label className="block" htmlFor="registration">연결할 보호소 등록번호<input id="registration" className={input} required maxLength={50} value={registration} onChange={e => { setRegistration(e.target.value); setMode(null); }} disabled={mutation.isPending} />
            </label>
            <label className="block" htmlFor="review-note">확인 메모<textarea id="review-note" className={input} rows={4} required maxLength={1000} value={note} onChange={e => { setNote(e.target.value); setMode(null); }} disabled={mutation.isPending} />
            </label>
            <div className="flex flex-wrap gap-3">
              <button className={`${control} bg-brand text-brand-ink text-gray-900`} disabled={mutation.isPending || !registration.trim() || !note.trim()}>확인 후 승인하기</button>
              <button type="button" className={control} disabled={mutation.isPending} onClick={() => setMode('reject')}>반려 사유 작성하기</button>
            </div>
          </form>
          {mode === 'approve' && <section className={`${panel} mt-5`} aria-label="승인 최종 확인">
            <h3 className="font-bold">담당자 권한을 부여하시겠어요?</h3>
            <p className="my-3 break-words">{query.data.applicantName} · 보호소 등록번호 {registration}</p>
            <p className="mb-4">확인한 등록번호로 회원에게 보호소 담당자 권한을 부여합니다.</p>
            <div className="flex flex-wrap gap-3">
              <button className={control} disabled={mutation.isPending} onClick={() => mutation.mutate('approve')}>{mutation.isPending ? '처리 중…' : '확인하고 승인'}</button>
              <button className={control} disabled={mutation.isPending} onClick={() => setMode(null)}>취소</button>
            </div>
          </section>}
          {mode === 'reject' && <form className={`${panel} mt-5`} onSubmit={e => { e.preventDefault(); if(reason.trim()) mutation.mutate('reject'); }}>
            <label htmlFor="reject-reason" className="font-bold">반려 사유<textarea id="reject-reason" className={input} required maxLength={1000} rows={4} value={reason} onChange={e => setReason(e.target.value)} disabled={mutation.isPending} />
            </label>
            <p className="my-3 text-sm">작성한 사유는 신청자에게 전달됩니다. (최대 1,000자)</p>
            <div className="flex flex-wrap gap-3">
              <button className={control} disabled={mutation.isPending || !reason.trim()}>{mutation.isPending ? '처리 중…' : '사유 전달하고 반려'}</button>
              <button type="button" className={control} disabled={mutation.isPending} onClick={() => setMode(null)}>취소</button>
            </div>
          </form>}</section> : <section className={panel}>
          <h2 className="text-lg font-bold">처리 결과</h2>
          <p className="mt-3">처리일 {date(a.reviewedAt)}</p>
          <h3 className="mt-4 font-bold">{a.status === 'REJECTED' ? '반려 사유' : '확인 메모'}</h3>
          <p className="mt-2 whitespace-pre-wrap break-words">{query.data.reviewNote || '—'}</p>{a.careRegNo && <Link className={`${control} mt-5 inline-block`} to={`/admin/shelters/${encodeURIComponent(a.careRegNo)}`}>연결된 보호소 상세 보기</Link>}</section>}</div>
    </>}{mutation.isError && <Feedback error={mutation.error} retry={() => void query.refetch()} />}</AdminShelterLayout>;
}

export default function AdminShelterApplicationDetail() {
  const params = useParams();
  return <Detail key={params.id ?? params.registration} />;
}
