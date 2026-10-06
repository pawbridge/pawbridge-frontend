export function videoDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '—';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) % 60;
  return `${hours ? `${hours}:${String(minutes).padStart(2, '0')}` : minutes}:${String(total % 60).padStart(2, '0')}`;
}
export function videoThumbnail(url: string | null): string {
  try {
    const parsed = new URL(url ?? '');
    return parsed.protocol === 'https:' && parsed.hostname === 'i.ytimg.com'
      && !parsed.username && !parsed.password && !parsed.port ? parsed.href : '';
  } catch { return ''; }
}
export function videoPlayerUrl(videoId: string): string | undefined {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return undefined;
  // Only mounted after an explicit play action. Do not autoplay or hide YouTube controls.
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&playsinline=1`;
}
