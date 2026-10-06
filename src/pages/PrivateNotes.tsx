import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { favoriteNote, getNotes } from '../api/privateNotes.api';
import ContactLayout, { contactButton } from '../components/contact/ContactLayout';
import Pagination from '../components/common/Pagination';

export default function PrivateNotes() {
  const [params, setParams] = useSearchParams();
  const owner = useAuthStore((state) => state.user?.id);
  const box = params.get('box') === 'SENT' ? 'SENT' : 'INBOX';
  const favorites = params.get('favorites') === 'true';
  const pageValue = Number(params.get('page') || '1');
  const page =
    Number.isSafeInteger(pageValue) && pageValue > 0 && pageValue <= 10001 ? pageValue - 1 : 0;
  const client = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const query = useQuery({
    queryKey: ['private-notes', owner, box, favorites, page],
    queryFn: ({ signal }) => getNotes(box, favorites, page, signal),
    retry: false,
  });
  function navigate(nextBox = box, nextFavorite = favorites, nextPage = 0) {
    setParams({
      box: nextBox,
      ...(nextFavorite ? { favorites: 'true' } : {}),
      ...(nextPage ? { page: String(nextPage + 1) } : {}),
    });
  }
  async function star(id: string, value: boolean) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(id);
    setError('');
    try {
      await favoriteNote(id, value);
      await client.invalidateQueries({ queryKey: ['private-notes', owner] });
    } catch {
      setError('즐겨찾기를 변경하지 못했어요. 다시 시도해 주세요.');
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }
  return (
    <ContactLayout>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold">쪽지</h2>
        <p className="text-sm text-brand-muted dark:text-gray-400">
          {query.data?.totalElements ?? 0}개의 쪽지
        </p>
      </div>
      <div className="my-6 flex flex-wrap items-center gap-3">
        <nav aria-label="쪽지함 선택" className="flex gap-3">
          {(['INBOX', 'SENT'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => navigate(value)}
              aria-pressed={box === value}
              className={`${contactButton} ${box === value ? 'border-brand bg-brand font-bold text-brand-ink' : ''}`}
            >
              {value === 'INBOX' ? '받은 쪽지' : '보낸 쪽지'}
            </button>
          ))}
        </nav>
        <label className="ml-auto flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={favorites}
            onChange={(event) => navigate(box, event.target.checked)}
            className="rounded border-brand-border text-brand-focus focus:ring-brand-focus"
          />
          즐겨찾기만 보기
        </label>
      </div>
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      {query.isPending && (
        <p role="status" className="rounded-xl border border-brand-border p-10 text-center">
          쪽지를 불러오는 중입니다…
        </p>
      )}
      {query.isError && (
        <div role="alert" className="rounded-xl border border-brand-border p-8 text-center">
          <p>쪽지를 불러오지 못했어요.</p>
          <button className={`${contactButton} mt-4`} onClick={() => void query.refetch()}>
            다시 시도
          </button>
        </div>
      )}
      {query.data && !query.data.content.length && (
        <div className="rounded-xl border border-brand-border p-10 text-center">
          <h3 className="font-bold">
            {favorites ? '즐겨찾기한 쪽지가 없어요' : '아직 쪽지가 없어요'}
          </h3>
          <p className="mt-2 text-sm text-brand-muted dark:text-gray-400">
            글 작성자의 닉네임에서 쪽지를 보낼 수 있습니다.
          </p>
          {page > 0 && (
            <button className={`${contactButton} mt-4`} onClick={() => navigate(box, favorites)}>
              첫 페이지로
            </button>
          )}
        </div>
      )}
      <ul className="space-y-3">
        {query.data?.content.map((note) => (
          <li
            key={note.noteId}
            className={`flex min-w-0 items-start gap-3 rounded-xl border border-brand-border p-4 sm:items-center dark:border-gray-700 ${box === 'INBOX' && !note.readAt ? 'bg-brand-soft dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}
          >
            <div aria-hidden="true" className="relative mt-1 h-8 w-8 shrink-0">
              <img src="/contact/avatar-background.svg" alt="" width={32} height={32} />
              <span className="absolute inset-0 flex items-center justify-center text-sm text-brand-ink">
                {Array.from(note.counterpartNickname)[0]}
              </span>
            </div>
            <Link
              to={`/notes/${note.noteId}`}
              state={{ from: `/notes?${params.toString()}` }}
              className="min-w-0 flex-1 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-focus"
            >
              <p className="break-words text-lg font-bold leading-7">{note.counterpartNickname}</p>
              <p className="mt-1 line-clamp-1 text-base leading-[26px]">
                {note.body.split('\n')[0]}
              </p>
              <p className="mt-1 line-clamp-1 text-sm leading-6 text-brand-muted dark:text-gray-400">
                {note.body.split('\n').slice(1).join(' ') ||
                  (note.direction === 'INBOX' && !note.readAt
                    ? '아직 읽지 않은 쪽지입니다.'
                    : '쪽지를 열어 내용을 확인하세요.')}
              </p>
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-brand-muted dark:text-gray-400">
                <span>
                  {note.direction === 'SENT'
                    ? '보낸 쪽지'
                    : note.readAt
                      ? '받은 쪽지'
                      : '읽지 않음'}
                </span>
                <time dateTime={note.createdAt}>
                  {new Date(note.createdAt).toLocaleString('ko-KR')}
                </time>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => void star(note.noteId, !note.favorite)}
              disabled={busy !== null}
              aria-label={`${note.counterpartNickname} 쪽지 즐겨찾기 ${note.favorite ? '해제' : '추가'}`}
              aria-pressed={note.favorite}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-focus disabled:opacity-50"
            >
              <img
                src={note.favorite ? '/contact/star-filled.svg' : '/contact/star.svg'}
                alt=""
                width={20}
                height={20}
              />
            </button>
          </li>
        ))}
      </ul>
      {query.data && (
        <Pagination
          separated
          currentPage={page}
          totalPages={query.data.totalPages}
          onPageChange={(value) => navigate(box, favorites, value)}
        />
      )}
      <p className="mt-6 rounded-xl bg-brand-soft p-4 text-sm leading-6 text-brand-muted dark:bg-gray-800 dark:text-gray-400">
        별표로 즐겨찾기를 표시합니다. 쪽지는 최대 1년 보관되며, 내 쪽지함에서 삭제해도 상대방의
        쪽지는 삭제되지 않습니다.
      </p>
    </ContactLayout>
  );
}
