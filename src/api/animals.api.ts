import apiClient from './client';
import type { ApiResponse, Animal } from '../types/api.types.ts';

// 동물 목록 조회
export const getAnimals = async (): Promise<Animal[]> => {
  const response = await apiClient.get<ApiResponse<Animal[]>>('/animals');
  return response.data.data;
};

// 동물 상세 조회
export const getAnimalById = async (id: number): Promise<Animal> => {
  const response = await apiClient.get<ApiResponse<Animal>>(`/animals/${id}`);
  return response.data.data;
};

// 동물 찜하기
export const favoriteAnimal = async (id: number): Promise<void> => {
  await apiClient.post(`/animals/${id}/favorite`);
};

// 동물 찜 해제
export const unfavoriteAnimal = async (id: number): Promise<void> => {
  await apiClient.delete(`/animals/${id}/favorite`);
};