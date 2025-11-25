import apiClient from './client';
import type { Animal, PageResponse, AnimalSearchParams } from '../types/api.types';

// 동물 목록 조회 (페이지네이션, 필터링, 정렬)
export const getAnimals = async (params?: AnimalSearchParams): Promise<PageResponse<Animal>> => {
  const response = await apiClient.get<PageResponse<Animal>>('/api/animals', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      sort: params?.sort ?? 'createdAt,desc',
      ...(params?.species && { species: params.species }),
      ...(params?.breed && { breed: params.breed }),
      ...(params?.gender && { gender: params.gender }),
      ...(params?.neuterStatus && { neuterStatus: params.neuterStatus }),
      ...(params?.status && { status: params.status }),
      ...(params?.minAge && { minAge: params.minAge }),
      ...(params?.maxAge && { maxAge: params.maxAge }),
      ...(params?.region && { region: params.region }),
      ...(params?.city && { city: params.city }),
      ...(params?.keyword && { keyword: params.keyword }),
    },
  });
  return response.data;
};

// 동물 상세 조회
export const getAnimalById = async (id: number): Promise<Animal> => {
  const response = await apiClient.get<Animal>(`/api/animals/${id}`);
  return response.data;
};

// 동물 찜하기
export const favoriteAnimal = async (id: number): Promise<void> => {
  await apiClient.post(`/api/animals/${id}/favorite`);
};

// 동물 찜 해제
export const unfavoriteAnimal = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/animals/${id}/favorite`);
};