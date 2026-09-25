import axios from 'axios';
import { isPublicShelterRequest } from '../lib/shelters';
import { isPublicTravelRequest } from '../lib/travel';
import { getAuthSessionVersion, useAuthStore } from '../store/authStore.ts';

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
      throw new axios.CanceledError('로그인 정보가 변경되어 이전 요청 결과를 사용할 수 없습니다.');
    }
    return response;
  },
  (error) => {
    // 이전 계정의 401이 현재 계정을 로그아웃시키지 않도록 먼저 거른다.
    if (isPreviousSession(error.config)) {
      return Promise.reject(new axios.CanceledError('로그인 정보가 변경되어 이전 요청 결과를 사용할 수 없습니다.'));
    }
    if (axios.isCancel(error)) return Promise.reject(error);
    if (error.response) {
      switch (error.response.status) {
        case 401: {
          const requestUrl = error.config?.url || '';
          // 로그인 실패는 Login의 오류 안내로 전달하고 현재 입력을 유지한다.
          if (requestUrl === '/api/auth/login' && error.config?.method?.toLowerCase() === 'post') break;

          // 공개 API 경로 패턴: /api/animals 또는 /api/animals/{id}
          const isPublicAnimalApi = /^\/api\/animals(\/\d+(\/similar|\/chat\/messages)?)?(\?.*)?$/.test(requestUrl);
          
          if (isPublicAnimalApi || isPublicTravelRequest(requestUrl, error.config?.method) || isPublicShelterRequest(requestUrl, error.config?.method)) {
            // 공개 API는 에러만 로그하고 리다이렉트하지 않음
            console.warn('공개 API 인증 실패 (리다이렉트 제외):', requestUrl);
          } else {
            // 인증이 필요한 API는 로그인 페이지로 리다이렉트
            console.error('인증 실패: 로그인이 필요합니다');
            useAuthStore.getState().clearAuth();
            window.location.href = '/login';
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
