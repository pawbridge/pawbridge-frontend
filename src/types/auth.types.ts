import type { UserRole } from './user.types';

// 로그인 요청
export interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 응답
export interface LoginResponse {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
  careRegNo: string | null;
  accessToken: string;
  // 기존 백엔드만 본문으로 보낸다. 새 백엔드는 HttpOnly 쿠키로 저장하며, 프론트는 어느 쪽도 저장하지 않는다.
  refreshToken?: string;
}
