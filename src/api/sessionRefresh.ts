import { isAccessTokenValidFor } from '../lib/accessToken.ts';

const REFRESH_LOCK_NAME = 'pawbridge-auth-refresh';

// 다른 탭이 저장한 토큰을 그대로 쓰려면 재시도 요청이 끝날 만큼 남아 있어야 한다.
const MINIMUM_REUSABLE_TOKEN_LIFETIME_MS = 30_000;

export interface RefreshLockManager {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>;
}

export interface SessionRefresherOptions {
  // 서버에 새 Access Token을 요청한다. 실패하면 reject한다.
  requestAccessToken: () => Promise<string>;
  // 다른 탭이 먼저 재발급해 저장한 토큰을 읽는다.
  readStoredAccessToken: () => string | null;
  // 서버에서 받은 토큰을 잠금 안에서 저장한다. 잠금이 풀린 뒤 저장하면 다음 탭이 이전 토큰을 읽는다.
  saveAccessToken: (accessToken: string, failedAccessToken: string | null) => void;
  // Web Locks API가 없으면 undefined를 돌려준다. 이때는 탭 안에서만 중복을 막는다.
  getLockManager: () => RefreshLockManager | undefined;
}

export type RefreshAccessToken = (failedAccessToken: string | null) => Promise<string>;

/**
 * Refresh Token은 재발급마다 교체되므로 같은 쿠키로 두 번 요청하면 재사용으로 거부될 수 있다.
 * 탭 안에서는 진행 중인 요청을 공유하고, 탭 사이에서는 Web Lock으로 한 번에 하나만 요청한다.
 */
export function createSessionRefresher(options: SessionRefresherOptions): RefreshAccessToken {
  let pendingRefresh: Promise<string> | null = null;

  const refreshWhileHoldingLock = async (failedAccessToken: string | null): Promise<string> => {
    const storedAccessToken = options.readStoredAccessToken();
    const isRefreshedElsewhere = storedAccessToken !== null
      && storedAccessToken !== failedAccessToken
      && isAccessTokenValidFor(storedAccessToken, MINIMUM_REUSABLE_TOKEN_LIFETIME_MS);
    if (isRefreshedElsewhere) {
      return storedAccessToken;
    }
    const refreshedAccessToken = await options.requestAccessToken();
    options.saveAccessToken(refreshedAccessToken, failedAccessToken);
    return refreshedAccessToken;
  };

  const runRefresh = (failedAccessToken: string | null): Promise<string> => {
    const lockManager = options.getLockManager();
    if (!lockManager) {
      return refreshWhileHoldingLock(failedAccessToken);
    }
    return lockManager.request(REFRESH_LOCK_NAME, () => refreshWhileHoldingLock(failedAccessToken));
  };

  return (failedAccessToken) => {
    if (pendingRefresh) {
      return pendingRefresh;
    }
    pendingRefresh = runRefresh(failedAccessToken).finally(() => {
      pendingRefresh = null;
    });
    return pendingRefresh;
  };
}
