import { QueryClient } from '@tanstack/react-query';

// QueryClient 인스턴스 생성
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 쿼리 기본 설정
      retry: 1,  // 실패 시 1번 재시도
      refetchOnWindowFocus: false,  // 창 포커스 시 자동 새로고침 끄기
      staleTime: 1000 * 60 * 5,  // 5분간 데이터를 "신선함"으로 간주
      gcTime: 1000 * 60 * 10,  // 10분 후 캐시 삭제 (구 cacheTime)
    },
    mutations: {
      // 뮤테이션 기본 설정
      retry: 0,  // POST/PUT/DELETE는 재시도 안 함
    },
  },
});