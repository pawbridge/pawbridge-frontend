import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { isPublicShelterRequest } from '../lib/shelters';
import { isPublicTravelRequest } from '../lib/travel';
import { getAuthSessionVersion, useAuthStore } from '../store/authStore.ts';
import { AUTH_LOGIN_PATH, AUTH_LOGOUT_PATH, refreshAccessToken } from './authSession.ts';
import { isSessionEndedRefreshFailure } from './sessionRefresh.ts';

declare module 'axios' {
  interface AxiosRequestConfig {
    // 토큰 재발급 후 다시 보낸 요청이다. 다시 401이면 재발급하지 않는다.
    authRetried?: boolean;
  }
}

/**
 * API Client 설정
 * 
 * 개발 환경: vite.config.ts의 proxy 설정을 통해 로컬 서버로 요청
 * 배포 환경: VITE_API_BASE_URL 환경 변수를 통해 API Gateway로 요청
 * 
 * Vercel 환경 변수 설정 예시:
 * VITE_API_BASE_URL=https://api-gateway.example.com
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios가 응답에도 전달하는 요청 config를 기준으로 로그인 세션을 구분한다.
const requestSessions = new WeakMap<object, number>();
const isPreviousSession = (config?: object) => config !== undefined
  && requestSessions.has(config)
  && requestSessions.get(config) !== getAuthSessionVersion();

const createPreviousSessionError = () => new axios.CanceledError('로그인 정보가 변경되어 이전 요청 결과를 사용할 수 없습니다.');

function isPublicRequest(requestUrl: string, method?: string): boolean {
  const normalizedMethod = method?.toLowerCase();
  // 공개 API 경로 패턴: /api/v1/animals 또는 /api/v1/animals/{id}
  const isPublicAnimalApi = /^\/api\/v1\/animals(\/\d+(\/similar|\/chat\/messages)?)?(\?.*)?$/.test(requestUrl);
  const isPublicVideoApi = requestUrl === '/api/v1/home/videos' && normalizedMethod === 'get';
  return isPublicVideoApi
    || isPublicAnimalApi
    || isPublicTravelRequest(requestUrl, method)
    || isPublicShelterRequest(requestUrl, method);
}

function isAuthEndpoint(requestUrl: string): boolean {
  return requestUrl.startsWith('/api/v1/auth/');
}

function readBearerToken(config: InternalAxiosRequestConfig): string | null {
  const authorization = config.headers?.Authorization;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return null;
  }
  return authorization.slice('Bearer '.length);
}

function redirectToLogin() {
  // 인증이 필요한 API는 로그인 페이지로 리다이렉트
  console.error('인증 실패: 로그인이 필요합니다');
  useAuthStore.getState().clearAuth();
  window.location.href = '/login';
}

// Bearer 토큰으로 보낸 인증 요청만 재발급 대상이다. 비로그인 요청은 기존처럼 로그인으로 보낸다.
function canRetryWithRefreshedToken(config: InternalAxiosRequestConfig, requestUrl: string): boolean {
  return !config.authRetried
    && !isAuthEndpoint(requestUrl)
    && readBearerToken(config) !== null;
}

async function retryWithRefreshedToken(error: AxiosError, failedConfig: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const requestSessionVersion = requestSessions.get(failedConfig);
  let refreshedAccessToken: string;
  try {
    refreshedAccessToken = await refreshAccessToken(readBearerToken(failedConfig));
  } catch (refreshFailure) {
    // 기다리는 동안 다른 계정으로 바뀌었다면 새 세션을 로그아웃시키지 않는다.
    if (requestSessionVersion !== getAuthSessionVersion()) {
      throw createPreviousSessionError();
    }
    // 서버 재시작 같은 일시 장애에는 로그인 상태를 유지하고 원래 요청만 실패시킨다.
    if (isSessionEndedRefreshFailure(refreshFailure)) {
      redirectToLogin();
    }
    throw error;
  }
  if (requestSessionVersion !== getAuthSessionVersion()) {
    throw createPreviousSessionError();
  }
  // 같은 회원이면 세션 버전이 유지되어 재시도 요청이 이전 세션 응답으로 취소되지 않는다.
  useAuthStore.getState().setAccessToken(refreshedAccessToken);
  if (requestSessionVersion !== getAuthSessionVersion()) {
    throw createPreviousSessionError();
  }
  failedConfig.authRetried = true;
  failedConfig.headers.Authorization = `Bearer ${refreshedAccessToken}`;
  return apiClient.request(failedConfig);
}

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    requestSessions.set(config, getAuthSessionVersion());
    // ✅ Zustand에서 토큰 가져오기
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ✅ Store Service용 X-User-Id 헤더 (실제 로그인 사용자 ID 사용)
    // API Gateway를 통해 요청할 때는 X-User-Id 헤더가 필요할 수 있음
    const user = useAuthStore.getState().user;
    if (user?.id) {
      config.headers['X-User-Id'] = String(user.id);
    }
    // 배포 환경에서는 로그인 필수이므로 테스트용 임시 ID 제거

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    if (isPreviousSession(response.config)) {
      throw createPreviousSessionError();
    }
    // 페이지 이탈 중 XHR이 status 0으로 끝나도 성공 데이터로 캐시하지 않는다.
    if (response.status === 0) {
      throw new axios.AxiosError(
        '서버의 HTTP 응답을 받지 못했습니다.',
        axios.AxiosError.ERR_NETWORK,
        response.config,
        response.request,
      );
    }
    return response;
  },
  (error) => {
    // 이전 계정의 401이 현재 계정을 로그아웃시키지 않도록 먼저 거른다.
    if (isPreviousSession(error.config)) {
      return Promise.reject(createPreviousSessionError());
    }
    if (axios.isCancel(error)) return Promise.reject(error);
    if (error.response) {
      switch (error.response.status) {
        case 401: {
          const requestUrl = error.config?.url || '';
          const method = error.config?.method?.toLowerCase();
          // 로그인 실패는 Login의 오류 안내로 전달하고 현재 입력을 유지한다.
          if (requestUrl === AUTH_LOGIN_PATH && method === 'post') break;
          // 로그아웃을 부른 화면이 결과와 무관하게 로그인 상태를 정리하고 이동한다.
          if (requestUrl === AUTH_LOGOUT_PATH && method === 'post') break;

          if (isPublicRequest(requestUrl, error.config?.method)) {
            // 공개 API는 에러만 로그하고 리다이렉트하지 않음
            console.warn('공개 API 인증 실패 (리다이렉트 제외):', requestUrl);
          } else if (error.config && canRetryWithRefreshedToken(error.config, requestUrl)) {
            return retryWithRefreshedToken(error, error.config);
          } else {
            redirectToLogin();
          }
          break;
        }
        case 403:
          console.error('권한 없음');
          break;
        case 404:
          console.error('리소스를 찾을 수 없습니다');
          break;
        case 500:
          console.error('서버 오류가 발생했습니다');
          break;
        default:
          console.error('API 에러:', error.response.data);
      }
    } else if (error.request) {
      console.error('서버 응답 없음: 네트워크를 확인하세요');
    } else {
      console.error('요청 설정 에러:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
