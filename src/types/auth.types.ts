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

// 회원가입 요청
export interface SignupRequest {
  email: string;
  name: string;
  password: string;
  rePassword: string;
  role: 'ROLE_USER' | 'ROLE_SHELTER';  // 백엔드 요구사항에 맞춤
  careRegNo?: string;  // 보호소 등록번호 (ROLE_SHELTER인 경우 필수)
}

// 회원가입 응답
export interface SignupResponse {
  userId: number;
  email: string;
  name: string;
  nickname: string;
}

// 비밀번호 재설정 코드 발송 요청
export interface SendResetCodeRequest {
  email: string;
}

// 비밀번호 재설정 요청
export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

// 이메일 인증 코드 발송 요청
export interface SendVerificationCodeRequest {
  email: string;
}

// 이메일 인증 코드 확인 요청
export interface VerifyCodeRequest {
  email: string;
  code: string;
}

// 이메일 인증 완료 응답
export interface EmailVerifiedResponse {
  verified: boolean;
}
