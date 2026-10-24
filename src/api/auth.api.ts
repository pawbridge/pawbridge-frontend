import apiClient from './client';
import { AUTH_LOGIN_PATH, AUTH_LOGOUT_PATH } from './authSession.ts';
import { AUTH_STORAGE_KEY, getAuthSessionVersion, useAuthStore } from '../store/authStore.ts';
import type { ApiResponse } from '../types/response.types.ts';
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  SendResetCodeRequest,
  ResetPasswordRequest,
  SendVerificationCodeRequest,
  VerifyCodeRequest,
  EmailVerifiedResponse,
} from '../types/auth.types.ts';

// 로그인. 서버가 Refresh Token을 HttpOnly 쿠키로 저장하도록 쿠키 전송을 허용한다.
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(AUTH_LOGIN_PATH, credentials, {
    withCredentials: true,
  });
  return response.data.data;
};

// 회원가입
export const signup = async (userData: SignupRequest): Promise<SignupResponse> => {
  const response = await apiClient.post<ApiResponse<SignupResponse>>(
    '/api/users/signup',
    userData
  );
  return response.data.data;
};

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

// 비밀번호 재설정 - 1단계: 인증 코드 발송
export const sendResetCode = async (data: SendResetCodeRequest): Promise<void> => {
  await apiClient.post<ApiResponse<null>>(
    '/api/auth/password/reset-request',
    data,
    {
      timeout: 30000, // 이메일 발송은 시간이 오래 걸릴 수 있으므로 30초로 설정
    }
  );
};

// 비밀번호 재설정 - 2단계: 인증 및 비밀번호 변경
export const resetPassword = async (data: ResetPasswordRequest): Promise<void> => {
  await apiClient.post<ApiResponse<null>>(
    '/api/auth/password/reset',
    data
  );
};

// 이메일 인증 코드 발송
export const sendEmailVerificationCode = async (data: SendVerificationCodeRequest): Promise<void> => {
  await apiClient.post<ApiResponse<null>>(
    '/api/v1/email/send',
    data,
    {
      timeout: 30000, // 이메일 발송은 시간이 오래 걸릴 수 있으므로 30초로 설정
    }
  );
};

// 이메일 인증 코드 검증
export const verifyEmailCode = async (data: VerifyCodeRequest): Promise<EmailVerifiedResponse> => {
  const response = await apiClient.post<ApiResponse<EmailVerifiedResponse>>(
    '/api/v1/email/verify',
    data
  );
  return response.data.data;
};
