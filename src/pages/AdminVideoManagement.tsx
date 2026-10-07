import { useRef, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { AdminEmpty, AdminError, AdminImage, AdminLoading, adminControl, adminInput, adminPanel, adminPrimary } from '../components/admin/AdminUI';
import VideoDialog from '../components/video/VideoDialog';
import { getVideoBoard, previewVideo, publishVideo, recheckVideo, reorderVideos, saveVideo } from '../api/homeVideos.api';
import type { HomeVideo, VideoBoard, VideoMetadata } from '../types/homeVideos';
import { videoDuration, videoThumbnail } from '../lib/homeVideos';

const key = ['admin-videos'];
function message(error: unknown) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') return error.response.data.message;
  return '처리하지 못했습니다. 입력을 유지했으니 잠시 후 다시 시도해 주세요.';
}

function VideoForm({ video, revision, onClose, onSaved }: {
  video?: HomeVideo; revision: number; onClose: () => void; onSaved: (board: VideoBoard) => void;
}) {
  const [url, setUrl] = useState(video ? `https://www.youtube.com/watch?v=${video.videoId}` : '');
  const [published, setPublished] = useState(video?.published ?? false);
  const [preview, setPreview] = useState<VideoMetadata>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  async function load() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(''); setPreview(undefined);
    try { setPreview(await previewVideo(url.trim())); }
    catch (failure) { setError(message(failure)); }
    finally { locked.current = false; setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (locked.current || !preview || (published && !preview.available)) return;
    locked.current = true; setBusy(true); setError('');
    try { onSaved(await saveVideo(video?.id, { url: url.trim(), published, revision })); }
    catch (failure) { setError(message(failure)); }
    finally { locked.current = false; setBusy(false); }
  }
  return <VideoDialog title={video ? '영상 편집' : '영상 등록'} onClose={onClose} busy={busy} form>
    <form onSubmit={event => void submit(event)} className="space-y-6">
      <p className="text-sm leading-6 text-brand-muted dark:text-stone-300">영상 주소를 입력하고 정보를 확인하세요.</p>
      <label className="block text-sm font-medium">YouTube 영상 주소
        <input type="url" required maxLength={2048} className={adminInput} value={url} disabled={busy}
          placeholder="https://youtu.be/영상ID" onChange={event => { setUrl(event.target.value); setPreview(undefined); setError(''); }} />
      </label>
      <div className="space-y-3">
        <p className="text-xs text-brand-muted dark:text-stone-300">공개된 HTTPS YouTube 영상 주소를 입력해 주세요.</p>
        <button type="button" className={adminControl} disabled={busy || !url.trim()} onClick={() => void load()}>{busy ? '확인 중…' : '정보 불러오기'}</button>
      </div>
      {preview && <section aria-label="영상 정보 미리보기" className={adminPanel}>
        <div className="flex flex-col gap-4 sm:flex-row">
          <AdminImage src={videoThumbnail(preview.thumbnailUrl)} alt={preview.title} className="aspect-video w-full rounded-xl object-cover sm:w-48" />
          <div className="min-w-0 space-y-2 break-words">
            <h3 className="font-medium">{preview.title}</h3>
            <p className="text-sm text-brand-muted">YouTube · {preview.channelTitle}</p><p className="text-xs">{videoDuration(preview.durationSeconds)}</p>
          </div>
        </div>
        <p className="mt-4 text-sm">{preview.available ? '게시 가능 · 공개 상태 · 한국에서 외부 재생 가능' : '재생 불가 · 숨김으로만 등록할 수 있습니다.'}</p>
      </section>}
      <label className="block text-sm font-medium">등록 후 상태
        <select className={adminInput} value={published ? 'PUBLISHED' : 'HIDDEN'} disabled={busy} onChange={event => setPublished(event.target.value === 'PUBLISHED')}>
          <option value="HIDDEN">숨김</option><option value="PUBLISHED" disabled={!preview?.available}>게시 중</option>
        </select>
      </label>
      <p className="text-xs leading-5 text-brand-muted dark:text-stone-300">게시 중인 영상은 최대 3개까지 홈에 표시됩니다. 노출 순서에서 위치를 바꿀 수 있습니다.</p>
      {error && <p role="alert" className="break-words text-sm text-red-700 dark:text-red-300">{error}</p>}
      <div className="flex flex-wrap justify-end gap-3"><button type="button" disabled={busy} className={adminControl} onClick={onClose}>취소</button>
        <button type="submit" className={adminPrimary} disabled={busy || !preview || (published && !preview.available)}>{busy ? '처리 중…' : video ? '변경 저장' : '등록하기'}</button></div>
    </form>
  </VideoDialog>;
}

function VideoOrder({ board, onClose, onSaved }: { board: VideoBoard; onClose: () => void; onSaved: (board: VideoBoard) => void }) {
  const [ordered, setOrdered] = useState(() => board.videos.filter(video => video.published));
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const locked = useRef(false);
  function move(index: number, direction: number) {
    const next = [...ordered]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; setOrdered(next);
  }
  async function save() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try { onSaved(await reorderVideos(ordered.map(video => video.id), board.revision)); }
    catch (failure) { setError(message(failure)); }
    finally { locked.current = false; setBusy(false); }
  }
  return <VideoDialog title="노출 순서" onClose={onClose} busy={busy} form>
    <p className="text-sm leading-6 text-brand-muted dark:text-stone-300">위에서부터 홈에 표시됩니다.<br />버튼으로 순서를 바꾸고 저장하세요.</p>
    <ol className="mt-6 space-y-4">{ordered.map((video, index) => <li key={video.id} className={adminPanel}>
      <div className="flex min-w-0 items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm text-brand-ink">{index + 1}</span>
        <AdminImage src={videoThumbnail(video.thumbnailUrl)} alt="" className="aspect-video w-[72px] shrink-0 rounded-lg object-cover" />
        <p className="min-w-0 break-words text-sm">{video.title ?? '정보를 다시 확인해 주세요.'}</p></div>
      <div className="mt-4 flex justify-end gap-3">
        <button type="button" className={adminControl} aria-label={`${video.title ?? video.videoId} 위로`} disabled={busy || index === 0} onClick={() => move(index, -1)}>위로</button>
        <button type="button" className={adminControl} aria-label={`${video.title ?? video.videoId} 아래로`} disabled={busy || index === ordered.length - 1} onClick={() => move(index, 1)}>아래로</button>
      </div>
    </li>)}</ol>
    {ordered.length === 0 && <p className="my-6">게시 중인 영상이 없습니다.</p>}
    {error && <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
    <div className="mt-6 flex justify-end gap-3"><button type="button" className={adminControl} disabled={busy} onClick={onClose}>취소</button>
      <button type="button" className={adminPrimary} disabled={busy || ordered.length < 2} onClick={() => void save()}>{busy ? '처리 중…' : '순서 저장'}</button></div>
  </VideoDialog>;
}

export default function AdminVideoManagement() {
  const client = useQueryClient();
  const board = useQuery({ queryKey: key, queryFn: ({ signal }) => getVideoBoard(signal), retry: false });
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('ALL');
  const [form, setForm] = useState<{ video?: HomeVideo; revision: number }>();
  const [order, setOrder] = useState<VideoBoard>();
  const [busyId, setBusyId] = useState(''); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const locked = useRef(false);
  const videos = board.data?.videos ?? [];
  function accepted(result: VideoBoard) {
    client.setQueryData(key, result); void client.invalidateQueries({ queryKey: ['home-videos'] });
    setForm(undefined); setOrder(undefined); setError(''); setNotice('변경 사항을 저장했습니다.');
  }
  async function action(video: HomeVideo, recheck = false) {
    if (locked.current || !board.data) return;
    locked.current = true; setBusyId(video.id); setError(''); setNotice('');
    try { accepted(recheck ? await recheckVideo(video.id, board.data.revision) : await publishVideo(video.id, !video.published, board.data.revision)); }
    catch (failure) { setError(message(failure)); }
    finally { locked.current = false; setBusyId(''); }
  }
  const visible = videos.filter(video => {
    const matchesText = `${video.title ?? ''} ${video.channelTitle ?? ''} ${video.videoId}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
    const matchesStatus = status === 'ALL' || (status === 'PUBLISHED' && video.published && video.available)
      || (status === 'HIDDEN' && !video.published) || (status === 'UNAVAILABLE' && !video.available);
    return matchesText && matchesStatus;
  });
  return <AdminLayout title="영상 관리" description="홈에 소개할 영상을 직접 선정하고 관리하세요.">
    <div className="flex flex-wrap gap-3"><button type="button" className={adminPrimary} disabled={!board.data || !!busyId} onClick={() => { setForm({ revision: board.data!.revision }); setNotice(''); }}>영상 등록</button>
      <button type="button" className={adminControl} disabled={!board.data || !!busyId || videos.filter(v => v.published).length < 2} onClick={() => setOrder(board.data)}>노출 순서</button></div>
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {error && <div role="alert" className={adminPanel}><p className="text-sm text-red-700 dark:text-red-300">{error}</p>
      <button type="button" className={`mt-3 ${adminControl}`} onClick={() => { void board.refetch(); setError(''); }}>목록 다시 불러오기</button></div>}
    {board.isPending ? <AdminLoading label="영상 목록을 불러오는 중입니다." /> : board.isError ? <AdminError title="영상 목록을 불러오지 못했습니다." retry={() => void board.refetch()} /> : <>
      <div className={`${adminPanel} flex flex-wrap gap-4 text-sm`}><span className="rounded-full bg-brand-soft px-3 py-1 text-brand-ink">홈 노출 {videos.filter(v => v.published && v.available).length} / 3</span>
        <span>숨김 {videos.filter(v => !v.published).length}</span><span>확인 필요 {videos.filter(v => !v.available).length}</span></div>
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]"><label className="min-w-0 text-sm font-medium">영상 검색<input type="search" className={adminInput} placeholder="제목 또는 채널명" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <label className="min-w-0 text-sm font-medium">게시 상태<select className={adminInput} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="ALL">전체</option><option value="PUBLISHED">게시 중</option><option value="HIDDEN">숨김</option><option value="UNAVAILABLE">재생 불가</option></select></label></div>
      <p className="text-xs text-brand-muted dark:text-stone-300">등록된 영상 {videos.length}개{search || status !== 'ALL' ? ` · 검색 결과 ${visible.length}개` : ''}</p>
      {visible.length === 0 ? <AdminEmpty title={videos.length ? '검색 결과가 없습니다.' : '등록된 영상이 없습니다.'}>영상 주소로 첫 영상을 등록해 주세요.</AdminEmpty> :
        <ul className="space-y-3">{visible.map(video => <li key={video.id} className={`${adminPanel} !p-4`}>
          <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <AdminImage src={videoThumbnail(video.thumbnailUrl)} alt="" className="aspect-video w-[104px] shrink-0 rounded-xl object-cover sm:w-[120px]" />
              <div className="min-w-0 space-y-1 break-words">
                <h2 className="line-clamp-2 text-base font-medium leading-6">{video.title ?? '영상 정보를 다시 확인해 주세요.'}</h2>
                <p className="text-sm text-brand-muted dark:text-stone-300">YouTube · {video.channelTitle ?? video.videoId}</p>
                <p className="text-xs text-brand-muted dark:text-stone-300">{videoDuration(video.durationSeconds)} · 등록 {new Date(video.createdAt).toLocaleDateString('ko-KR')}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-stone-100 px-3 py-2 text-xs dark:bg-stone-800">{!video.available ? '재생 불가' : video.published ? '게시 중' : '숨김'}</span>
              <button type="button" className={adminControl} disabled={!!busyId} aria-label={`${video.title ?? video.videoId} 편집`} onClick={() => setForm({ video, revision: board.data!.revision })}>편집</button>
              {!video.available && <button type="button" className={adminControl} disabled={!!busyId} aria-label={`${video.videoId} 재확인`} onClick={() => void action(video, true)}>재확인</button>}
              {(video.published || video.available) && <button type="button" className={video.published ? adminControl : adminPrimary} disabled={!!busyId}
                aria-label={`${video.title ?? video.videoId} ${video.published ? '숨김' : '게시'}`} onClick={() => void action(video)}>{busyId === video.id ? '처리 중…' : video.published ? '숨김' : '게시'}</button>}
            </div>
          </div>
        </li>)}</ul>}
      <p className="text-xs leading-5 text-brand-muted dark:text-stone-300">게시 중인 영상만 홈에 표시됩니다. 재생할 수 없는 영상은 게시 전에 확인하세요. 영상 정보는 주기적으로 갱신됩니다.</p>
    </>}
    {form && <VideoForm video={form.video} revision={form.revision} onClose={() => setForm(undefined)} onSaved={accepted} />}
    {order && <VideoOrder board={order} onClose={() => setOrder(undefined)} onSaved={accepted} />}
  </AdminLayout>;
}
