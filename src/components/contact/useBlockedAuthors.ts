import { useQuery } from '@tanstack/react-query';
import { getBlockedAuthors } from '../../api/privateNotes.api';
import { getAuthSessionVersion, useAuthStore } from '../../store/authStore';

export function useBlockedAuthors(authorIds: number[]) {
  const owner = useAuthStore((state) => state.user?.id);
  const session = getAuthSessionVersion();
  const ids = [...new Set(authorIds.filter(id => Number.isSafeInteger(id) && id > 0 && id !== owner))].sort((a, b) => a - b);
  const enabled = !!owner && ids.length > 0;
  const query = useQuery({
    queryKey: ['blocked-authors', owner, session, ids],
    queryFn: ({ signal }) => getBlockedAuthors(ids, signal),
    enabled,
    staleTime: 0,
    retry: false,
  });
  return {
    owner,
    memberIds: new Set(query.data ?? []),
    pending: enabled && query.isPending,
    failed: enabled && query.isError,
    retry: () => void query.refetch(),
  };
}
