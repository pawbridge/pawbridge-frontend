import apiClient from './client';
import type {
  AdminUserListParams,
  AdminUserListResponse,
  AdminUserListItem,
  UpdateUserRequest,
  UserInfoResponse,
  UpdateNicknameRequest,
  PasswordUpdateRequest,
  FavoriteListResponse,
  PageResponse,
  Animal,
} from '../types/api.types';

// 관리자용 회원 목록 조회
export const getAdminUsers = async (params?: AdminUserListParams): Promise<AdminUserListResponse> => {
  const response = await apiClient.get<{ code: number; data: AdminUserListResponse; message: string }>('/api/admin/users', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      ...(params?.keyword && { keyword: params.keyword }),
      ...(params?.role && { role: params.role }),
      ...(params?.sortBy && { sortBy: params.sortBy }),
      ...(params?.sortOrder && { sortOrder: params.sortOrder }),
    },
  });
  return response.data.data;
};

// 관리자용 회원 상세 조회
export const getAdminUserById = async (userId: number): Promise<AdminUserListItem> => {
  const response = await apiClient.get<{ code: number; data: AdminUserListItem; message: string }>(`/api/admin/users/${userId}`);
  return response.data.data;
};

// 회원 정보 수정
export const updateUser = async (userId: number, data: UpdateUserRequest): Promise<void> => {
  await apiClient.put<{ code: number; data: null; message: string }>(`/api/admin/users/${userId}`, data);
};

// 회원 삭제
export const deleteUser = async (userId: number): Promise<void> => {
  await apiClient.delete(`/api/admin/users/${userId}`);
};

// ========== 마이페이지 관련 API ==========

// 내 정보 조회
export const getMyInfo = async (): Promise<UserInfoResponse> => {
  const response = await apiClient.get<{ code: number; data: UserInfoResponse; message: string }>('/api/users/me');
  return response.data.data;
};

// 닉네임 변경
export const updateNickname = async (data: UpdateNicknameRequest): Promise<void> => {
  await apiClient.put<{ code: number; data: null; message: string }>('/api/users/me/nickname', data);
};

// 비밀번호 변경
export const updatePassword = async (data: PasswordUpdateRequest): Promise<void> => {
  await apiClient.put<{ code: number; data: null; message: string }>('/api/users/me/password', data);
};

// 내가 찜한 동물 목록 조회
export const getFavoriteAnimals = async (): Promise<FavoriteListResponse> => {
  const response = await apiClient.get<{ code: number; data: FavoriteListResponse; message: string }>('/api/users/me/favorite-animals');
  return response.data.data;
};

// 내 보호소가 등록한 동물 목록 조회 (페이징)
export const getRegisteredAnimals = async (page: number = 0, size: number = 20): Promise<PageResponse<Animal>> => {
  const response = await apiClient.get<{ code: number; data: PageResponse<Animal>; message: string }>('/api/users/me/registered-animals', {
    params: { page, size, sort: 'createdAt,desc' },
  });
  return response.data.data;
};
