import apiClient from './client';
import type { AdminDailyCount } from '../lib/adminStatistics';

export interface TodayVisits { date: string; count: number }
export interface VisitPeriod {
  startDate: string;
  endDate: string;
  today: string;
  collectionStartedAt: string;
  daily: AdminDailyCount[];
}
interface Envelope<T> { data: T }

// Deliberately independent of auth interceptors: no JWT/member ID or logout on an error.
async function publicRequest(path: string, method: 'GET' | 'POST'): Promise<TodayVisits | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch((import.meta.env.VITE_API_BASE_URL || '') + path, {
      method, credentials: 'include', cache: 'no-store', signal: controller.signal,
    });
    if (!response.ok) throw new Error('방문 통계 요청 실패');
    if (response.status === 204) return null;
    // Keep the timeout through body parsing, not only until response headers arrive.
    const envelope = await response.json() as Envelope<TodayVisits>;
    const data = envelope.data;
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isSafeInteger(data.count) || data.count < 0)
      throw new Error('방문 통계 응답 형식 오류');
    return data;
  } finally { clearTimeout(timer); }
}
export async function initializeVisit(): Promise<void> {
  await publicRequest('/api/v1/visits/identity', 'POST');
}
export async function countVisit(): Promise<TodayVisits | null> {
  return publicRequest('/api/v1/visits/today', 'POST'); // A known bot's 204 is not a count.
}
export async function getTodayVisits(): Promise<TodayVisits> {
  const data = await publicRequest('/api/v1/visits/today', 'GET');
  if (!data) throw new Error('방문 통계 응답 없음');
  return data;
}
export async function getVisitPeriod(startDate: string, endDate: string): Promise<VisitPeriod> {
  return (await apiClient.get<Envelope<VisitPeriod>>('/api/v1/admin/visits/stats/period', {
    params: { startDate, endDate },
  })).data.data;
}
