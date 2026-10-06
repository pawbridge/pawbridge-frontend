import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getNoteRecipient, sendNote } from '../api/privateNotes.api';
import ContactLayout, { contactButton } from '../components/contact/ContactLayout';
import { getAuthSessionVersion, useAuthStore } from '../store/authStore';
import type { SendNote } from '../types/privateNotes';

export default function PrivateNoteCompose() {
  const [params] = useSearchParams();
  const recipient = Number(params.get('to'));
  const owner = useAuthStore(state => state.user?.id);
  const navigate = useNavigate();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef<SendNote | null>(null);
  const busy = useRef(false);
  const count = Array.from(body).length;
  const target = useQuery({
    queryKey: ['private-notes', owner, 'recipient', recipient],
    queryFn: ({ signal }) => getNoteRecipient(recipient, signal),
    enabled: Number.isSafeInteger(recipient) && recipient > 0 && recipient !== owner,
    retry: false,
  });
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current || !target.data || !body.trim() || count > 5000) return;
    // The same logical send retains its key after an uncertain network result.
    // No private draft or token is written to browser storage.
    if (!pending.current) {
      const contextType = params.get('context');
      const contextId = Number(params.get('contextId'));
      pending.current = {
        recipientId: recipient, body, requestId: crypto.randomUUID(),
        ...(params.get('replyTo') ? { replyTo: params.get('replyTo')! } : {}),
        ...((contextType === 'POST' || contextType === 'REPORT') && Number.isSafeInteger(contextId) && contextId > 0
          ? { contextType, contextId } : {}),
      };
    }
    busy.current = true; setSending(true); setError('');
    const session = getAuthSessionVersion();
    try {
      const receipt = await sendNote(pending.current);
      if (session === getAuthSessionVersion()) navigate(`/notes/${receipt.noteId}`, { replace: true });
    } catch (failure) {
      if (session !== getAuthSessionVersion()) return;
      const status = (failure as { response?: { status: number; data?: { message?: string } } }).response?.status;
      // A definitive rejection permits a new edited draft; a timeout/5xx does not prove non-delivery.
      if (status && status >= 400 && status < 500) pending.current = null;
      setError((failure as { response?: { data?: { message?: string } } }).response?.data?.message
        || '전송 결과를 확인하지 못했습니다. 내용을 변경하지 않고 다시 보내면 중복 발송을 막을 수 있습니다.');
    } finally {
      busy.current = false;
      if (session === getAuthSessionVersion()) setSending(false);
    }
  }
  return <ContactLayout>
    <Link to="/notes" className="text-sm underline underline-offset-4">쪽지함으로</Link>
    <h2 className="mt-5 text-xl font-bold">{params.has('replyTo') ? '쪽지 답장' : '쪽지 보내기'}</h2>
    {target.isPending && target.fetchStatus === 'fetching' ? <p role="status" className="mt-6">받는 사람을 확인하고 있습니다.</p>
      : !target.data ? <div role="alert" className="mt-6 rounded-xl border border-brand-border p-6">이 상대에게 쪽지를 보낼 수 없습니다. 글의 작성자 메뉴에서 다시 선택해 주세요.</div>
        : <form onSubmit={submit} className="mt-6 space-y-6">
          <div className="rounded-xl bg-brand-soft p-4 text-brand-ink"><span className="text-sm">받는 사람</span><p className="mt-1 font-bold">{target.data.nickname}</p></div>
          <div>
            <label htmlFor="note-body" className="mb-2 block font-semibold">쪽지 내용</label>
            <textarea id="note-body" value={body} onChange={event => setBody(event.target.value)} readOnly={sending || pending.current !== null}
              rows={10} required aria-describedby="note-length note-help" className="w-full resize-y rounded-xl border border-brand-border bg-transparent p-4 leading-[26px] focus:outline-brand-focus dark:border-gray-700" />
            <p id="note-length" className={`mt-2 text-right text-sm ${count > 5000 ? 'text-red-700' : 'text-brand-muted'}`}>{count.toLocaleString()} / 5,000자</p>
            <p id="note-help" className="mt-2 text-sm leading-6 text-brand-muted dark:text-gray-400">전화번호·주소 등 민감한 정보는 신중하게 보내 주세요. 알림에는 쪽지 본문을 표시하지 않습니다.</p>
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
          {pending.current && !sending && <p className="text-sm leading-6 text-brand-muted">전송 결과가 불확실해 내용을 잠갔습니다. 아래 버튼으로 같은 쪽지를 다시 확인해 주세요. 새 내용을 작성하려면 먼저 보낸 쪽지함에서 전달 여부를 확인하세요.</p>}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={sending || !body.trim() || count > 5000} className={`${contactButton} border-brand bg-brand text-brand-ink`}>{sending ? '전송 중…' : pending.current ? '같은 쪽지 전송 확인' : '쪽지 보내기'}</button>
            <Link to="/notes?box=SENT" className={contactButton}>보낸 쪽지 확인</Link>
          </div>
        </form>}
  </ContactLayout>;
}
