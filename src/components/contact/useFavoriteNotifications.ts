import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFavoriteNotifications } from '../../api/favoriteNotifications.api';
import { getAuthSessionVersion, useAuthStore } from '../../store/authStore';
import {
  latestFavoriteChange,
  readFavoriteSeenAt,
  unseenFavoriteCount,
  writeFavoriteSeenAt,
} from '../../lib/favoriteNotifications';

// APMS 동기화가 30분마다라 5분 간격과 창으로 돌아올 때만 다시 읽는다.
const REFRESH_INTERVAL = 5 * 60 * 1000;

export function useFavoriteNotifications() {
  const userId = useAuthStore((state) => state.user?.id);
  const session = getAuthSessionVersion();
  const query = useQuery({
    queryKey: ['favorite-notifications', userId, session],
    queryFn: ({ signal }) => getFavoriteNotifications(signal),
    enabled: !!userId,
    staleTime: 0,
    retry: false,
    refetchInterval: REFRESH_INTERVAL,
    refetchOnWindowFocus: true,
  });
  const [seenAt, setSeenAt] = useState<{ userId: number | undefined; value: string | null }>(() => ({
    userId,
    value: userId ? readFavoriteSeenAt(userId) : null,
  }));
  // 다른 회원으로 바뀌면 그 회원의 읽음 시각을 다시 읽는다.
  const current = seenAt.userId === userId ? seenAt.value : userId ? readFavoriteSeenAt(userId) : null;
  const items = query.data ?? [];
  return {
    items,
    unread: unseenFavoriteCount(items, current),
    error: query.isError,
    retry: () => void query.refetch(),
    markSeen: () => {
      const latest = latestFavoriteChange(items);
      if (!userId || !latest) return;
      writeFavoriteSeenAt(userId, latest);
      setSeenAt({ userId, value: latest });
    },
  };
}
