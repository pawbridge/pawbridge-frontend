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
export const addFavorite = async (animalId: number): Promise<{ favoriteId: number }> => {
  const response = await apiClient.post<{ code: number; data: { favoriteId: number }; message: string }>(
    `/api/favorites/${animalId}`
  );
  return response.data.data;
};

// 동물 찜 제거
export const removeFavorite = async (animalId: number): Promise<void> => {
  await apiClient.delete<{ code: number; data: null; message: string }>(`/api/favorites/${animalId}`);
};

// 찜 여부 확인
export const checkFavorite = async (animalId: number): Promise<boolean> => {
  const response = await apiClient.get<{ code: number; data: boolean; message: string }>(
    `/api/favorites/${animalId}/check`
  );
  return response.data.data;
};