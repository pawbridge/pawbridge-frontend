import type { UserRole } from './user.types';

// 이메일 로그인 요청(운영 시험 계정 전용, pages/TestLogin 참고)
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
  // Refresh Token은 본문에 없고 서버가 HttpOnly 쿠키로 저장한다.
  accessToken: string;
}
