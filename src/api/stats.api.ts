import apiClient from './client';
import type {
  SignupPeriodsResponse,
  DailySignupStatsResponse,
  DailyAnimalStatsResponse,
} from '../types/api.types';

// 전체 회원 수 조회
export const getTotalUserCount = async (): Promise<number> => {
  const response = await apiClient.get<{ code: number; data: number; message: string }>('/api/admin/users/stats/total-users');
  return response.data.data;
};

// 일별 가입자 수 통계 조회
export const getDailySignupStats = async (startDate: string, endDate: string): Promise<DailySignupStatsResponse[]> => {
  const response = await apiClient.get<{ code: number; data: DailySignupStatsResponse[]; message: string }>('/api/admin/users/stats/daily-signups', {
    params: {
      startDate,
      endDate,
    },
  });
  return response.data.data;
};

// 기간별 가입자 수 통계 조회 (나중에 사용 예정)
export const getSignupPeriods = async (): Promise<SignupPeriodsResponse> => {
  const response = await apiClient.get<{ code: number; data: SignupPeriodsResponse; message: string }>('/api/admin/users/stats/signup-periods');
  return response.data.data;
};

// 일별 동물 등록 건수 통계 조회
export const getDailyAnimalStats = async (startDate: string, endDate: string): Promise<DailyAnimalStatsResponse[]> => {
  const response = await apiClient.get<DailyAnimalStatsResponse[]>('/api/admin/stats/daily-animals', {
    params: {
      startDate,
      endDate,
    },
  });
  return response.data;
};

// 오늘 작성된 게시글 수 조회
export const getTodayPostCount = async (): Promise<number> => {
  const response = await apiClient.get<{ code: number; data: number; message: string }>('/api/admin/posts/stats/today');
  return response.data.data;
};
