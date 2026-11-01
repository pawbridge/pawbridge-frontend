import apiClient from './client';
import { AUTH_LOGOUT_PATH } from './authSession.ts';
import { AUTH_STORAGE_KEY, getAuthSessionVersion, useAuthStore } from '../store/authStore.ts';

// 로그아웃. 서버가 로그인 유지 쿠키를 지운다. 브라우저 로그인 상태(store)는 호출한 화면이 정리한다.
export const logout = async (): Promise<void> => {
  const sessionVersion = getAuthSessionVersion();
  // 호출 직후 화면이 로그인 상태를 지워도 기존 백엔드가 요구하는 Bearer 토큰을 보낸다.
  const accessToken = useAuthStore.getState().accessToken;
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
  try {
    await apiClient.post(AUTH_LOGOUT_PATH, {}, {
      withCredentials: true,
      headers,
    });
  } finally {
    // 이전 버전이 저장하던 토큰 키를 정리한다.
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // 기다리는 동안 다른 계정으로 로그인했다면 새 계정의 저장소를 지우지 않는다.
    if (sessionVersion === getAuthSessionVersion()) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }
};

// 서버 로그아웃 결과를 기다리지 않고 브라우저 로그인 상태를 바로 정리한다.
export const logoutWithoutWaiting = (): void => {
  // logout이 토큰을 먼저 읽도록 로그인 상태 정리보다 앞에서 호출한다.
  logout().catch(() => {
    // 서버 로그아웃 실패와 무관하게 브라우저 로그인 상태는 정리한다.
  });
  useAuthStore.getState().logout();
};
