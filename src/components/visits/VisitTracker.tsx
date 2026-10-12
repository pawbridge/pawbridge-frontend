import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { countVisit, initializeVisit } from '../../api/visits.api';
import { kstToday } from '../../lib/adminStatistics';
import { isPublicVisitPath, withVisitLock } from '../../lib/visitBootstrap';
import { visitsEnabled, todayVisitKey } from '../../lib/visitConfig';
let pending: Promise<void> | undefined;
let countedDay: string | undefined;

export default function VisitTracker() {
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!visitsEnabled || !isPublicVisitPath(pathname)) return;
    let active = true;
    const count = () => {
      if (document.visibilityState === 'hidden' || countedDay === kstToday()) return;
      pending ??= withVisitLock(async () => {
        await initializeVisit();
        await countVisit(); // Browser attaches the new cookie immediately.
        countedDay = kstToday(); // A known bot's 204 also ends today's bootstrap attempts.
      }).finally(() => { pending = undefined; });
      // No auth side effects or unhandled rejection; existing application keeps working.
      void pending.then(() => { if (active) void queryClient.invalidateQueries({ queryKey: todayVisitKey }); }).catch(() => {});
    };
    count();
    const timer = window.setInterval(() => { if (countedDay !== kstToday()) count(); }, 60_000);
    document.addEventListener('visibilitychange', count);
    window.addEventListener('pageshow', count);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', count);
      window.removeEventListener('pageshow', count);
    };
  }, [pathname, queryClient]);
  return null;
}
