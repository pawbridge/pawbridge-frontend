import apiClient from './client';

export interface FavoriteNotification {
  animalId: number;
  status: string;
  previousStatus: string;
  changedAt: string;
  species: string | null;
  breed: string | null;
  imageUrl: string | null;
  apmsNoticeNo: string | null;
  shelterName: string | null;
}

// 관심 등록 뒤 상태가 바뀐 동물(동물마다 최근 1건, 한국 날짜로 15일)을 최신순으로 받는다.
export async function getFavoriteNotifications(signal?: AbortSignal): Promise<FavoriteNotification[]> {
  const response = await apiClient.get<{ data: { content: FavoriteNotification[] } }>(
    '/api/v1/users/me/favorite-animal-notifications',
    { signal },
  );
  return response.data.data.content;
}
