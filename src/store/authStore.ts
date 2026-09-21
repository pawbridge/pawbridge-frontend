import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '../lib/queryClient.ts';
import type { User } from '../types/api.types';

// Store 타입 정의
interface AuthState {
  // 상태
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  
  // 액션
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

// 브라우저 메모리에서만 관리한다. 이전 세션의 늦은 응답을 구분한다.
let authSessionVersion = 0;
export const getAuthSessionVersion = () => authSessionVersion;

function clearSessionCache() {
  authSessionVersion += 1;
  // clear는 진행 중인 조회를 취소하고 조회·변경 캐시를 제거한다.
  // 서버에 이미 전달된 변경 요청을 취소하는 것은 아니다.
  queryClient.clear();
}

// Store 생성
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      accessToken: null,
      refreshToken: null,

      // 로그인 (인증 정보 저장)
      setAuth: (user, accessToken, refreshToken) => {
        const previous = get();
        if (previous.user?.id !== user.id || previous.user?.role !== user.role || previous.accessToken !== accessToken) {
          clearSessionCache();
        }
        set({ user, accessToken, refreshToken });
      },

      // 로그아웃 (인증 정보 삭제)
      clearAuth: () => {
        clearSessionCache();
        set({ user: null, accessToken: null, refreshToken: null });
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
      name: 'auth-storage',  // localStorage 키 이름
    }
  )
);