import apiClient from './client';
import type { TravelDetail, TravelPlaces, TravelRegions } from '../types/travel.types';

export async function getTravelRegions(signal?: AbortSignal): Promise<TravelRegions> {
  return (await apiClient.get<TravelRegions>('/api/places/regions', { signal })).data;
}

export async function getTravelPlaces(areaCode: string, page = 0, signal?: AbortSignal): Promise<TravelPlaces> {
  return (await apiClient.get<TravelPlaces>('/api/places', { params: { areaCode, page }, signal })).data;
}

export async function getTravelDetail(contentId: string, signal?: AbortSignal): Promise<TravelDetail> {
  return (await apiClient.get<TravelDetail>(`/api/places/${contentId}`, { signal })).data;
}
