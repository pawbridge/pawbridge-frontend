import axios from 'axios';
import { useAuthStore } from '../store/authStore.ts';  // 추가

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
    
    // ✅ Store Service용 X-User-Id 헤더 (로그인 전 테스트용)
    // 로그인 구현 후에는 실제 userId로 교체 필요
    const user = useAuthStore.getState().user;
    config.headers['X-User-Id'] = user?.id || 1;  // 기본값 1 (테스트용)
    
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