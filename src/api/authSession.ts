import axios from 'axios';
import { isAccessTokenExpiringWithin, readUserFromAccessToken } from '../lib/accessToken.ts';
import { getAuthSessionVersion, readPersistedAccessToken, useAuthStore } from '../store/authStore.ts';
import { createSessionRefresher, type RefreshLockManager } from './sessionRefresh.ts';
import type { ApiResponse } from '../types/response.types.ts';

// 쿠키 Path(/api/v1/auth)는 서버 내부 경로 변환 전의 주소로 비교되므로 v1 주소를 직접 호출한다.
export const AUTH_LOGIN_PATH = '/api/v1/auth/login';
export const AUTH_REFRESH_PATH = '/api/v1/auth/refresh';
export const AUTH_LOGOUT_PATH = '/api/v1/auth/logout';

// 앱 시작 직후의 첫 요청이 만료로 실패하지 않도록 이 시간 안에 만료될 토큰도 미리 재발급한다.
const STARTUP_REFRESH_MARGIN_MS = 60_000;

interface RefreshResponse {
  accessToken: string;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

// apiClient 인터셉터를 거치면 401 처리에서 다시 재발급을 부르게 되므로 별도 요청으로 보낸다.
async function requestAccessTokenFromServer(): Promise<string> {
  const response = await axios.post<ApiResponse<RefreshResponse>>(
    `${apiBaseUrl}${AUTH_REFRESH_PATH}`,
    {},
    {
      withCredentials: true,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    },
  );
  const accessToken = response.data?.data?.accessToken;
  if (typeof accessToken !== 'string' || readUserFromAccessToken(accessToken) === null) {
    throw new Error('재발급 응답에 사용할 수 있는 Access Token이 없습니다.');
  }
  return accessToken;
}

function getBrowserLockManager(): RefreshLockManager | undefined {
  if (typeof navigator === 'undefined') {
    return undefined;
  }
  return navigator.locks;
}

// 기다리는 동안 로그아웃하거나 다른 계정으로 바뀌었다면 새 토큰으로 되살리지 않는다.
function saveRefreshedAccessToken(accessToken: string, failedAccessToken: string | null) {
  if (useAuthStore.getState().accessToken !== failedAccessToken) {
    return;
  }
  useAuthStore.getState().setAccessToken(accessToken);
}

export const refreshAccessToken = createSessionRefresher({
  requestAccessToken: requestAccessTokenFromServer,
  readStoredAccessToken: readPersistedAccessToken,
  saveAccessToken: saveRefreshedAccessToken,
  getLockManager: getBrowserLockManager,
});

/**
 * 저장된 토큰이 만료됐거나 곧 만료되면 한 번만 조용히 재발급한다.
 * 실패하면 공개 화면이 이전 로그인 헤더를 보이지 않도록 이동 없이 로그인 상태만 정리한다.
 */
export async function refreshExpiredSessionOnStartup(): Promise<void> {
  const storedAccessToken = useAuthStore.getState().accessToken;
  if (!storedAccessToken) {
    return;
  }
  if (!isAccessTokenExpiringWithin(storedAccessToken, STARTUP_REFRESH_MARGIN_MS)) {
    return;
  }
  const sessionVersion = getAuthSessionVersion();
  try {
    const refreshedAccessToken = await refreshAccessToken(storedAccessToken);
    // 기다리는 동안 로그인·로그아웃이 일어났다면 새 세션을 덮어쓰지 않는다.
    if (sessionVersion === getAuthSessionVersion()) {
      useAuthStore.getState().setAccessToken(refreshedAccessToken);
    }
  } catch {
    if (sessionVersion === getAuthSessionVersion()) {
      useAuthStore.getState().clearAuth();
    }
  }
}
