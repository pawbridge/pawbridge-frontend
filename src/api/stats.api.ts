import apiClient from './client';
import type { AdminDailyCount } from '../lib/adminStatistics';
import type {
  SignupPeriodsResponse,
  DailySignupStatsResponse,
  DailyAnimalStatsResponse,
} from '../types/api.types';

export interface AdminPeriodTrend {
  startDate: string;
  endDate: string;
  daily: AdminDailyCount[];
  previousDayCount: number;
}
export interface ShelterApplicationStats extends AdminPeriodTrend {
  currentPending: number;
  approvedCount: number;
  rejectedCount: number;
}
export type PostStatsBoardType = 'MISSING' | 'PROTECTION' | 'REPORT' | 'ADOPTION' | 'COMMUNICATION';
export interface PostPeriodStats extends AdminPeriodTrend {
  byBoardType: { boardType: PostStatsBoardType; count: number }[];
}
interface Envelope<T> { data: T }

export const getIntakeTrend = async (startDate: string, endDate: string): Promise<AdminPeriodTrend> =>
  (await apiClient.get<AdminPeriodTrend>('/api/admin/stats/intake-trend', { params: { startDate, endDate } })).data;
export const getShelterApplicationStats = async (startDate: string, endDate: string): Promise<ShelterApplicationStats> =>
  (await apiClient.get<Envelope<ShelterApplicationStats>>('/api/admin/users/shelter-applications/stats', { params: { startDate, endDate } })).data.data;
export const getPostPeriodStats = async (startDate: string, endDate: string): Promise<PostPeriodStats> =>
  (await apiClient.get<Envelope<PostPeriodStats>>('/api/admin/posts/stats/period', { params: { startDate, endDate } })).data.data;
export const getRegisteredShelterCount = async (): Promise<number> =>
  (await apiClient.get<number>('/api/shelters/count')).data;

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
