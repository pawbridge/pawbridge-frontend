import apiClient from './client';
import type { 
  ApiResponse, 
  LoginRequest, 
  LoginResponse, 
  SignupRequest, 
  User 
} from '../types/api.types.ts';

// 로그인
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    '/auth/login',
    credentials
  );
  return response.data.data;
};

// 회원가입
export const signup = async (userData: SignupRequest): Promise<User> => {
  const response = await apiClient.post<ApiResponse<User>>(
    '/auth/signup',
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