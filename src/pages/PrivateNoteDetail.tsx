import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { blockNoteMember, deleteNote, favoriteNote, getNote, readNote } from '../api/privateNotes.api';
import ContactLayout, { contactButton } from '../components/contact/ContactLayout';
import { useNoteNotifications } from '../components/contact/useNoteNotifications';
import { getAuthSessionVersion, useAuthStore } from '../store/authStore';

export default function PrivateNoteDetail() {
  const { id = '' } = useParams();
  const owner = useAuthStore(state => state.user?.id);
  const session = getAuthSessionVersion();
  const query = useQuery({ queryKey: ['private-notes', owner, 'detail', id], queryFn: ({ signal }) => getNote(id, signal), retry: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [readFailed, setReadFailed] = useState(false);
  const inFlight = useRef(false);
  const readAttempt = useRef('');
  const client = useQueryClient();
  const { refresh } = useNoteNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const note = query.data;
  const from = (location.state as { from?: string } | null)?.from;
  const back = from?.startsWith('/notes?') ? from : '/notes';
  useEffect(() => {
    if (!note || note.direction !== 'INBOX' || note.readAt || readAttempt.current === `${session}:${id}`) return;
    // Runs after the body has rendered, never when opening the notification menu/list.
    readAttempt.current = `${session}:${id}`;
    void readNote(id).then(() => { if (session === getAuthSessionVersion()) { setReadFailed(false); void refresh(); } })
      .catch(() => { if (session === getAuthSessionVersion()) setReadFailed(true); });
  }, [note, id, session, refresh]);
  async function change(action: () => Promise<void>, deleted = false, success = '') {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(''); setNotice('');
    try {
      await action();
      if (session !== getAuthSessionVersion()) return;
      setNotice(success);
      await client.invalidateQueries({ queryKey: ['private-notes', owner] });
      void refresh();
      if (deleted) navigate(back, { replace: true });
    } catch { if (session === getAuthSessionVersion()) setError('변경하지 못했습니다. 잠시 후 다시 시도해 주세요.'); }
    finally { inFlight.current = false; if (session === getAuthSessionVersion()) setBusy(false); }
  }
  return <ContactLayout>
    <Link to={back} className="text-sm underline underline-offset-4">쪽지 목록으로</Link>
    <h2 className="mt-5 text-xl font-bold">{note?.direction === 'SENT' ? '보낸 쪽지' : '받은 쪽지'}</h2>
    {query.isPending ? <p role="status" className="mt-6">쪽지를 불러오고 있습니다.</p>
      : query.isError || !note ? <div role="alert" className="mt-6 rounded-xl border border-brand-border p-6"><p>쪽지를 찾을 수 없거나 불러오지 못했습니다. 삭제되거나 보존 기간이 만료된 쪽지는 볼 수 없습니다.</p><button className={`${contactButton} mt-4`} onClick={() => void query.refetch()}>다시 확인</button></div>
        : <>
          <article className="mt-6 rounded-xl border border-brand-border p-5 sm:p-6 dark:border-gray-700">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-sm text-brand-muted">{note.direction === 'INBOX' ? '보낸 사람' : '받는 사람'}</p><p className="mt-1 text-xl font-bold">{note.counterpartNickname}</p></div>
              <time className="text-sm text-brand-muted" dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleString('ko-KR')}</time>
            </div>
            <p className="mt-6 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-base leading-[26px]">{note.body}</p>
            {note.contextHref && <Link to={note.contextHref} className={`${contactButton} mt-6`}>연락한 글 보기</Link>}
          </article>
          {readFailed && !note.readAt && <div role="alert" className="mt-4 text-sm">읽음 상태를 반영하지 못했습니다. <button className="underline" onClick={() => void change(() => readNote(id))}>읽음 반영 재시도</button></div>}
          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="mt-4 text-sm">{notice}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            {note.canReply && <Link to={`/notes/new?to=${note.counterpartId}&replyTo=${id}`} className={`${contactButton} border-brand bg-brand text-brand-ink`}>답장하기</Link>}
            <button disabled={busy} onClick={() => void change(() => favoriteNote(id, !note.favorite))} className={contactButton}>{note.favorite ? '즐겨찾기 해제' : '즐겨찾기'}</button>
            {note.counterpartId && <button disabled={busy} onClick={() => { if (confirm('이 회원의 새 쪽지를 차단할까요? 기존 쪽지는 삭제하지 않습니다.')) void change(() => blockNoteMember(note.counterpartId!), false, '회원을 차단했습니다. 차단 관리에서 해제할 수 있습니다.'); }} className={contactButton}>회원 차단</button>}
            <button disabled={busy} onClick={() => { if (confirm('내 쪽지함에서 삭제할까요? 상대방의 쪽지함에서는 삭제되지 않으며 전송을 취소하는 기능이 아닙니다.')) void change(() => deleteNote(id), true); }} className={contactButton}>내 쪽지함에서 삭제</button>
          </div>
          <p className="mt-6 text-sm leading-6 text-brand-muted dark:text-gray-400">쪽지는 발송일로부터 최대 1년 보관됩니다. 양쪽 쪽지함에서 모두 제거되면 원문도 삭제됩니다.</p>
        </>}
  </ContactLayout>;
}
