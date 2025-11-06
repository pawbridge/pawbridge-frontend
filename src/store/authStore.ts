import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  updateUser: (user: Partial<User>) => void;
}

// Store 생성
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 초기 상태
      user: null,
      accessToken: null,
      refreshToken: null,

      // 로그인 (인증 정보 저장)
      setAuth: (user, accessToken, refreshToken) => 
        set({ user, accessToken, refreshToken }),

      // 로그아웃 (인증 정보 삭제)
      clearAuth: () => 
        set({ user: null, accessToken: null, refreshToken: null }),

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