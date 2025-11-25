import apiClient from './client';
import type { 
  ApiResponse, 
  LoginRequest, 
  LoginResponse, 
  SignupRequest,
  SignupResponse,
  ResetPasswordRequestRequest,
  ResetPasswordRequest,
  User 
} from '../types/api.types.ts';

// 로그인
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>(
    '/login',
    credentials
  );
  return response.data;
};

// 회원가입
export const signup = async (userData: SignupRequest): Promise<SignupResponse> => {
  const response = await apiClient.post<{
    code: number;
    message: string;
    data: SignupResponse;
  }>(
    '/api/v1/users/signup',
    userData
  );
  return response.data.data;
};

// 로그아웃
export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
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
    '/api/v1/auth/password/reset-request',
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
    '/api/v1/auth/password/reset',
    data
  );
};