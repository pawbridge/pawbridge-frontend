import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '../lib/queryClient.ts';
import { readUserFromAccessToken } from '../lib/accessToken.ts';
import type { User } from '../types/user.types';

export const AUTH_STORAGE_KEY = 'auth-storage';

// Store 타입 정의
interface AuthState {
  // 상태
  user: User | null;
  accessToken: string | null;

  // 액션
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

type PersistedAuthState = Pick<AuthState, 'user' | 'accessToken'>;

// 브라우저 메모리에서만 관리한다. 이전 세션의 늦은 응답을 구분한다.
let authSessionVersion = 0;
export const getAuthSessionVersion = () => authSessionVersion;

function clearSessionCache() {
  authSessionVersion += 1;
  // clear는 진행 중인 조회를 취소하고 조회·변경 캐시를 제거한다.
  // 서버에 이미 전달된 변경 요청을 취소하는 것은 아니다.
  queryClient.clear();
}

// 다른 탭이 저장한 최신 토큰을 확인한다. 이 탭의 메모리 상태는 자동으로 갱신되지 않는다.
export function readPersistedAccessToken(): string | null {
  try {
    const persisted = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? 'null');
    const accessToken = persisted?.state?.accessToken;
    return typeof accessToken === 'string' ? accessToken : null;
  } catch {
    return null;
  }
}

// Store 생성
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      accessToken: null,

      // 로그인 (인증 정보 저장)
      setAuth: (user, accessToken) => {
        const previous = get();
        if (previous.user?.id !== user.id || previous.user?.role !== user.role || previous.accessToken !== accessToken) {
          clearSessionCache();
        }
        set({ user, accessToken });
      },

      // 같은 회원의 토큰 재발급은 세션을 유지한다. 진행 중인 조회와 캐시를 버리지 않는다.
      setAccessToken: (accessToken) => {
        const previousUser = get().user;
        const tokenUser = readUserFromAccessToken(accessToken);
        const isSameSession = tokenUser !== null
          && previousUser !== null
          && previousUser.id === tokenUser.id
          && previousUser.role === tokenUser.role;
        if (isSameSession) {
          set({ accessToken });
          return;
        }
        clearSessionCache();
        set({ user: tokenUser, accessToken });
      },

      // 로그아웃 (인증 정보 삭제)
      clearAuth: () => {
        clearSessionCache();
        set({ user: null, accessToken: null });
      },

      // 로그아웃 (clearAuth의 별칭)
      logout: () => get().clearAuth(),

      // 사용자 정보 업데이트
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: AUTH_STORAGE_KEY,  // localStorage 키 이름
      // 1버전부터 Refresh Token은 HttpOnly 쿠키로만 다루고 브라우저 저장소에 남기지 않는다.
      version: 1,
      partialize: (state): PersistedAuthState => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
      migrate: (persistedState) => {
        const legacyState = persistedState as Partial<PersistedAuthState> | undefined;
        return {
          user: legacyState?.user ?? null,
          accessToken: legacyState?.accessToken ?? null,
        };
      },
    }
  )
);
