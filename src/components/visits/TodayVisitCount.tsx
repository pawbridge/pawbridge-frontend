import { useQuery } from '@tanstack/react-query';
import { getTodayVisits } from '../../api/visits.api';
import { kstToday } from '../../lib/adminStatistics';
import { todayVisitKey, visitsEnabled } from '../../lib/visitConfig';

export default function TodayVisitCount() {
  const query = useQuery({ queryKey: todayVisitKey, queryFn: getTodayVisits, enabled: visitsEnabled,
    staleTime: 60_000, refetchInterval: 60_000, retry: false });
  if (!visitsEnabled || !query.isSuccess || query.isFetching && query.data.date !== kstToday()) return null;
  // A failed refresh must not show a fabricated zero or yesterday's result.
  if (query.data.date !== kstToday()) return null;
  return <p className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm leading-6"
    aria-label={`오늘 방문 ${query.data.count.toLocaleString()}`}>
    <span className="text-brand-muted dark:text-gray-300">오늘 방문</span>
    <span className="font-medium tabular-nums text-brand-ink dark:text-white">{query.data.count.toLocaleString()}</span>
  </p>;
}
