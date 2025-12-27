import axios from 'axios';
import { useAuthStore } from '../store/authStore.ts';  // 추가

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

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
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
    return response;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error('인증 실패: 로그인이 필요합니다');
          // ✅ Zustand에서 인증 정보 삭제
          useAuthStore.getState().clearAuth();
          window.location.href = '/login';
          break;
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