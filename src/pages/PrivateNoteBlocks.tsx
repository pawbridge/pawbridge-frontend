import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNoteBlocks, unblockNoteMember } from '../api/privateNotes.api';
import ContactLayout, { contactButton } from '../components/contact/ContactLayout';
import Pagination from '../components/common/Pagination';
import { getAuthSessionVersion, useAuthStore } from '../store/authStore';

export default function PrivateNoteBlocks() {
  const [params, setParams] = useSearchParams();
  const parsed = Number(params.get('page') || '1');
  const page = Number.isInteger(parsed) && parsed >= 1 && parsed <= 10001 ? parsed - 1 : 0;
  const owner = useAuthStore((state) => state.user?.id);
  const client = useQueryClient();
  const data = useQuery({
    queryKey: ['private-notes', owner, 'blocks', page],
    queryFn: ({ signal }) => getNoteBlocks(page, signal),
    retry: false,
  });
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function unblock(id: number) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    const session = getAuthSessionVersion();
    try {
      await unblockNoteMember(id);
      if (session === getAuthSessionVersion())
        await client.invalidateQueries({ queryKey: ['private-notes', owner] });
    } catch {
      if (session === getAuthSessionVersion())
        setError('차단을 해제하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      pending.current = false;
      if (session === getAuthSessionVersion()) setBusy(false);
    }
  }
  return (
    <ContactLayout active="blocks">
      <h2 className="text-xl font-bold">차단 관리</h2>
      <p className="mt-2 text-sm leading-6 text-brand-muted dark:text-gray-400">
        차단하면 서로 새 쪽지를 보내지 못합니다. 기존 쪽지는 남으며, 공개 게시글은 숨기지 않습니다.
      </p>
      {data.isPending ? (
        <p role="status" className="mt-6">
          차단 목록을 불러오고 있습니다.
        </p>
      ) : data.isError ? (
        <div role="alert" className="mt-6">
          <p>목록을 불러오지 못했습니다.</p>
          <button className={`${contactButton} mt-4`} onClick={() => void data.refetch()}>
            다시 시도
          </button>
        </div>
      ) : !data.data.content.length ? (
        <p className="mt-8 rounded-xl border border-brand-border p-6">
          {page ? '이 페이지에 차단한 회원이 없습니다.' : '차단한 회원이 없습니다.'}
          {page > 0 && (
            <button className={`${contactButton} ml-3`} onClick={() => setParams({ page: '1' })}>
              첫 페이지
            </button>
          )}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.data.content.map((member) => (
            <li
              key={member.memberId}
              className="flex items-center justify-between gap-4 rounded-xl border border-brand-border p-4 dark:border-gray-700"
            >
              <div className="min-w-0">
                <p className="break-words font-bold">{member.nickname}</p>
                <p className="mt-1 text-sm text-brand-muted">
                  {new Date(member.createdAt).toLocaleDateString('ko-KR')}에 차단
                </p>
              </div>
              <button
                disabled={busy}
                onClick={() => void unblock(member.memberId)}
                className={`${contactButton} shrink-0`}
              >
                차단 해제
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {data.data && (
        <Pagination
          separated
          currentPage={page}
          totalPages={data.data.totalPages}
          onPageChange={(value) => setParams({ page: String(value + 1) })}
        />
      )}
    </ContactLayout>
  );
}
