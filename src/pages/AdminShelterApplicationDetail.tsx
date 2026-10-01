import { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApplication, approveApplication, rejectApplication } from '../api/shelter.api';
import { useAuthStore } from '../store/authStore';
import { AdminShelterLayout, Status } from '../components/shelter/ShelterUI';
import { date, errorMessage } from '../components/shelter/shelterView';
import { AdminDetailFields, AdminError, AdminLoading, adminControl, adminInput, adminPanel, adminPrimary } from '../components/admin/AdminUI';
import StatsDialog from '../components/statistics/StatsDialog';

function Detail() {
  const { id = '' } = useParams();
  const userId = useAuthStore(state => state.user?.id);
  const location = useLocation();
  const client = useQueryClient();
  const [registration, setRegistration] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<'approve' | 'reject' | null>(null);
  const validId = /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
  const queryKey = ['shelter', 'application', userId, id];
  const query = useQuery({ queryKey, queryFn: () => getApplication(Number(id)), enabled: validId });
  const mutation = useMutation({
    mutationFn: (action: 'approve' | 'reject') => action === 'approve' ? approveApplication(Number(id), registration.trim(), note.trim()) : rejectApplication(Number(id), reason.trim()),
    onSuccess: async data => { client.setQueryData(queryKey, data); setMode(null); await client.invalidateQueries({ queryKey: ['shelter'] }); },
  });
  const data = query.data;
  const application = data?.application;
  const locked = mutation.isPending || mutation.isError;
  return <AdminShelterLayout title="담당자 신청 상세">
    <Link className={adminControl} to={`/admin/shelter-applications${location.search}`}>신청 목록으로</Link>
    {!validId ? <AdminError title="잘못된 신청 주소입니다." /> : query.isPending ? <AdminLoading label="신청을 불러오는 중입니다." /> : query.isError ? <AdminError title="신청 정보 조회 실패" retry={() => void query.refetch()} /> : data && application && <>
      <section className={`${adminPanel} space-y-4`}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="break-words text-xl font-bold">{application.shelterName}</h2><Status status={application.status} /></div><p className="text-sm text-brand-muted dark:text-stone-300">신청자가 입력한 보호소 이름입니다. 실제 소속 여부는 별도로 확인해 주세요.</p></section>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-2">
        <section className={`${adminPanel} space-y-5`}><h2 className="text-xl font-bold">신청 정보</h2><AdminDetailFields fields={[['신청자', data.applicantName], ['이메일', data.applicantEmail], ['신청일', date(application.requestedAt)]]} /></section>
        {application.status === 'PENDING' ? <section className={`${adminPanel} space-y-4`}>
          <h2 className="text-xl font-bold">보호소 확인</h2><p className="text-sm text-brand-muted dark:text-stone-300">소속을 확인한 보호소의 등록번호를 입력해 주세요.</p>
          <Link className="inline-flex min-h-11 items-center text-sm underline" to="/admin/shelters" target="_blank" rel="noreferrer">보호소 목록에서 확인 (새 탭)</Link>
          <form className="space-y-5" onSubmit={event => { event.preventDefault(); if (!locked && registration.trim() && note.trim()) setMode('approve'); }}>
            <fieldset disabled={locked} className="space-y-5">
              <div><label htmlFor="registration" className="text-sm font-medium">연결할 보호소 등록번호 (필수)</label><input id="registration" className={adminInput} required maxLength={50} value={registration} onChange={event => setRegistration(event.target.value)} /><p className="mt-2 text-xs text-brand-muted dark:text-stone-300">필수 입력 · 최대 50자</p></div>
              <div><label htmlFor="review-note" className="text-sm font-medium">확인 메모 (필수)</label><textarea id="review-note" className={adminInput} rows={4} required maxLength={1000} value={note} onChange={event => setNote(event.target.value)} /><p className="mt-2 text-xs text-brand-muted dark:text-stone-300">필수 입력 · 최대 1,000자 · {note.length} / 1,000</p></div>
            </fieldset>
            <div className="flex flex-wrap gap-3"><button className={adminPrimary} disabled={locked || !registration.trim() || !note.trim()}>확인 후 승인하기</button><button type="button" className={adminControl} disabled={locked} onClick={() => setMode('reject')}>반려 사유 작성하기</button></div>
          </form>
        </section> : <section className={`${adminPanel} space-y-5`}><h2 className="text-xl font-bold">처리 결과</h2><p className="text-sm">처리일 {date(application.reviewedAt)}</p><h3 className="font-medium">{application.status === 'REJECTED' ? '반려 사유' : '확인 메모'}</h3><p className="whitespace-pre-wrap break-words text-sm">{data.reviewNote || '—'}</p>{application.careRegNo && <Link className={adminControl} to={`/admin/shelters/${encodeURIComponent(application.careRegNo)}`}>연결된 보호소 상세 보기</Link>}</section>}
      </div>
    </>}
    {mode && data && <StatsDialog compact title={mode === 'approve' ? '담당자 권한을 부여하시겠어요?' : '반려 사유'} busy={mutation.isPending} onClose={() => setMode(null)}>
      <form className="space-y-5" onSubmit={event => { event.preventDefault(); if (!locked && (mode === 'approve' ? registration.trim() && note.trim() : reason.trim())) mutation.mutate(mode); }}>
        <p className="break-words text-sm">{data.applicantName} · {data.application.shelterName}</p>
        {mode === 'approve' ? <><p className="break-all text-sm">보호소 등록번호 {registration}</p><p className="text-sm text-brand-muted dark:text-stone-300">확인한 등록번호로 회원에게 보호소 담당자 권한을 부여합니다.</p></> : <><label htmlFor="reject-reason" className="block text-sm font-medium">반려 사유 (필수)<textarea id="reject-reason" className={adminInput} required maxLength={1000} rows={4} value={reason} onChange={event => setReason(event.target.value)} disabled={locked} /></label><p className="text-xs text-brand-muted dark:text-stone-300">신청자에게 전달됩니다. 최대 1,000자 · {reason.length} / 1,000</p></>}
        {mutation.isError ? <><p role="alert" className="text-sm text-red-700 dark:text-red-300">{errorMessage(mutation.error)} 입력 내용을 보존했습니다. 중복 처리 전에 최신 상태를 확인해 주세요.</p><button type="button" className={adminPrimary} disabled={query.isFetching} onClick={async () => { const result = await query.refetch(); if (!result.isError) { mutation.reset(); setMode(null); } }}>최신 상태 확인</button></> : <div className="flex flex-wrap justify-end gap-3"><button type="button" className={adminControl} disabled={mutation.isPending} onClick={() => setMode(null)}>취소</button><button className={adminPrimary} disabled={locked || (mode === 'reject' && !reason.trim())}>{mutation.isPending ? '처리 중…' : mode === 'approve' ? '확인하고 승인' : '사유 전달하고 반려'}</button></div>}
      </form>
    </StatsDialog>}
    {mutation.isError && !mode && <AdminError title="처리 결과 확인이 필요합니다." retry={() => setMode(mutation.variables || 'approve')} />}
  </AdminShelterLayout>;
}
export default function AdminShelterApplicationDetail() {
  const { id } = useParams();
  return <Detail key={id} />;
}
