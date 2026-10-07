import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHomeVideos } from '../../api/homeVideos.api';
import type { HomeVideo } from '../../types/homeVideos';
import { videoDuration, videoPlayerUrl, videoThumbnail } from '../../lib/homeVideos';
import VideoDialog from '../video/VideoDialog';
import { AdminImage, adminControl } from '../admin/AdminUI';

function VideoCard({ video, onPlay, className }: { video: HomeVideo; onPlay: () => void; className: string }) {
  return <button type="button" onClick={onPlay} aria-label={`${video.title} 재생`}
    className={`${className} min-w-0 overflow-hidden rounded-xl border border-brand-border bg-white text-left text-brand-ink transition-colors hover:border-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-focus dark:border-stone-700 dark:bg-surface-dark dark:text-white`}>
    <span className="relative block aspect-video overflow-hidden rounded-xl">
      <AdminImage src={videoThumbnail(video.thumbnailUrl)} alt="" className="h-full w-full object-cover" />
      <span className="absolute left-1/2 top-1/2 flex size-[52px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-sm"><img src="/video/play.svg" alt="" width="24" height="24" /></span>
      <span className="absolute bottom-2 right-2 rounded-lg bg-brand-ink px-1.5 py-1 text-xs leading-[18px] text-white">{videoDuration(video.durationSeconds)}</span>
    </span>
    <span className="block space-y-2 p-4">
      <span className="block line-clamp-2 break-words text-xl font-bold leading-7">{video.title}</span>
      <span className="block break-words text-sm leading-6 text-brand-muted dark:text-stone-300">YouTube · {video.channelTitle}</span>
    </span>
  </button>;
}

export default function HomeVideoSection() {
  const videos = useQuery({ queryKey: ['home-videos'], queryFn: ({ signal }) => getHomeVideos(signal),
    retry: false, staleTime: 60_000 });
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState<HomeVideo>();
  const list = videos.data?.filter(video => video.available && video.title && videoPlayerUrl(video.videoId)).slice(0, 3) ?? [];
  const current = Math.min(index, Math.max(0, list.length - 1));
  if (videos.isError || (!videos.isPending && list.length === 0)) return null;
  return <section aria-labelledby="home-videos-heading" className="mt-12 lg:mt-14">
    <h2 id="home-videos-heading" className="text-2xl font-bold leading-[42px] sm:text-[28px]">함께하는 일상</h2>
    <p className="mt-3 text-base leading-[26px] text-brand-muted dark:text-stone-300">반려동물과 함께하는 평범하고 특별한 하루.</p>
    {videos.isPending ? <div role="status" aria-label="영상을 불러오고 있어요." className="mt-6 grid gap-6 md:grid-cols-3">
      {[0, 1, 2].map(i => <div key={i} aria-hidden="true" className={`${i ? 'hidden md:block' : ''} aspect-video rounded-xl bg-brand-soft motion-safe:animate-pulse`} />)}
    </div> : <>
      <div className="mt-6 grid gap-6 md:grid-cols-3">{list.map((video, i) =>
        <VideoCard key={video.id} video={video} onPlay={() => setPlaying(video)} className={i === current ? 'block' : 'hidden md:block'} />)}</div>
      {list.length > 1 && <nav aria-label="홈 영상 탐색" className="mt-6 flex items-center justify-between gap-4 md:hidden">
        <button type="button" className={adminControl} disabled={current === 0} onClick={() => setIndex(current - 1)}>이전</button>
        <span aria-live="polite" className="text-sm">{current + 1} / {list.length}</span>
        <button type="button" className={adminControl} disabled={current === list.length - 1} onClick={() => setIndex(current + 1)}>다음</button>
      </nav>}
    </>}
    {playing && <VideoDialog title="함께하는 일상" onClose={() => setPlaying(undefined)}>
      <iframe title={`${playing.title} · YouTube 영상`} src={videoPlayerUrl(playing.videoId)}
        className="aspect-video min-h-[200px] w-full rounded-xl border-0" allow="encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      <h3 className="mt-4 break-words text-lg font-bold">{playing.title}</h3>
      <p className="mt-2 text-sm text-brand-muted dark:text-stone-300">YouTube · {playing.channelTitle}</p>
      <p className="mt-3 text-xs leading-5 text-brand-muted dark:text-stone-300">플레이어를 열면 YouTube에 접속 정보가 전달됩니다. 재생되지 않으면 YouTube에서 확인해 주세요.</p>
      <a href={`https://www.youtube.com/watch?v=${playing.videoId}`} target="_blank" rel="noopener noreferrer" className={`mt-4 ${adminControl}`}>YouTube에서 보기</a>
    </VideoDialog>}
  </section>;
}
