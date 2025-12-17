import apiClient from './client';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  ResetPasswordRequestRequest,
  ResetPasswordRequest,
  SendVerificationCodeRequest,
  VerifyCodeRequest,
  EmailVerifiedResponse,
  User
} from '../types/api.types.ts';

// 로그인
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<{
    code: number;
    message: string;
    data: LoginResponse;
  }>('/api/auth/login', credentials);
  return response.data.data;
};

// 회원가입
export const signup = async (userData: SignupRequest): Promise<SignupResponse> => {
  const response = await apiClient.post<{
    code: number;
    message: string;
    data: SignupResponse;
  }>(
    '/api/users/signup',
    userData
  );
  return response.data.data;
};

// 로그아웃
export const logout = async (): Promise<void> => {
  await apiClient.post('/api/auth/logout');
  // localStorage에서 토큰 제거
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // Zustand persist 저장소도 제거
  localStorage.removeItem('auth-storage');
};

// 내 정보 조회
export const getMyInfo = async (): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>('/users/me');
  return response.data.data;
};

// 비밀번호 재설정 - 1단계: 인증 코드 발송
export const sendResetCode = async (data: ResetPasswordRequestRequest): Promise<void> => {
  await apiClient.post<{
    code: number;
    message: string;
    data: null;
  }>(
    '/api/auth/password/reset-request',
    data
  );
};

// 비밀번호 재설정 - 2단계: 인증 및 비밀번호 변경
export const resetPassword = async (data: ResetPasswordRequest): Promise<void> => {
  await apiClient.post<{
    code: number;
    message: string;
    data: null;
  }>(
    '/api/auth/password/reset',
    data
  );
};

// 이메일 인증 코드 발송
export const sendEmailVerificationCode = async (data: SendVerificationCodeRequest): Promise<void> => {
  await apiClient.post<{
    code: number;
    message: string;
    data: null;
  }>(
    '/api/email/send',
    data
  );
};

// 이메일 인증 코드 검증
export const verifyEmailCode = async (data: VerifyCodeRequest): Promise<EmailVerifiedResponse> => {
  const response = await apiClient.post<{
    code: number;
    message: string;
    data: EmailVerifiedResponse;
  }>(
    '/api/email/verify',
    data
  );
  return response.data.data;
};