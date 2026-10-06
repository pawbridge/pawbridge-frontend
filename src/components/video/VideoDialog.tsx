import { useEffect, useState, type ReactNode } from 'react';
import StatsDialog from '../statistics/StatsDialog';

export default function VideoDialog({ title, children, busy = false, onClose, form = false }: {
  title: string; children: ReactNode; busy?: boolean; onClose: () => void; form?: boolean;
}) {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 639px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const change = () => setMobile(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  return <StatsDialog title={title} onClose={onClose} busy={busy} compact={form}
    fullScreen={form && mobile} wrapFocus closeIcon="/video/close.svg" headingClassName="text-2xl sm:text-[28px] sm:leading-[42px]">
    {children}
  </StatsDialog>;
}
