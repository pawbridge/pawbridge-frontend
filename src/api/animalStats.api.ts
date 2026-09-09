import apiClient from './client';
import type {
  TodayAnimalStats,
  AnimalStatusStats,
  RegionalAnimalStats,
} from '../types/api.types';

export const getTodayAnimalStats = async (): Promise<TodayAnimalStats> => {
  const response = await apiClient.get<TodayAnimalStats>('/api/v1/animals/stats/today');
  return response.data;
};

export const getAnimalStatusStats = async (
  startDate?: string,
  endDate?: string,
): Promise<AnimalStatusStats[]> => {
  const response = await apiClient.get<AnimalStatusStats[]>('/api/v1/animals/stats/status', {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getRegionalAnimalStats = async (
  startDate?: string,
  endDate?: string,
): Promise<RegionalAnimalStats[]> => {
  const response = await apiClient.get<RegionalAnimalStats[]>('/api/v1/animals/stats/regional', {
    params: { startDate, endDate },
  });
  return response.data;
};
