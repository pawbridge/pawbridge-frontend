import apiClient from './client';
import type {
  AdminPostListParams,
  AdminPostListResponse,
  PostResponse,
  UpdatePostRequest,
} from '../types/api.types';

// 관리자용 게시글 목록 조회
export const getAdminPosts = async (params?: AdminPostListParams): Promise<AdminPostListResponse> => {
  const response = await apiClient.get<{ code: number; data: AdminPostListResponse; message: string }>('/api/admin/posts', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      sort: params?.sort ?? 'createdAt,desc',
      ...(params?.boardType && { boardType: params.boardType }),
      ...(params?.keyword && { keyword: params.keyword }),
    },
  });
  return response.data.data;
};

// 관리자용 게시글 상세 조회
export const getAdminPostById = async (postId: number): Promise<PostResponse> => {
  const response = await apiClient.get<{ code: number; data: PostResponse; message: string }>(`/api/admin/posts/${postId}`);
  return response.data.data;
};

// 게시글 수정
export const updatePost = async (postId: number, data: UpdatePostRequest): Promise<void> => {
  const formData = new FormData();

  if (data.title) {
    formData.append('title', data.title);
  }

  if (data.content) {
    formData.append('content', data.content);
  }

  await apiClient.put<{ code: number; data: null; message: string }>(
    `/api/admin/posts/${postId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
};

// 게시글 삭제
export const deletePost = async (postId: number): Promise<void> => {
  await apiClient.delete(`/api/admin/posts/${postId}`);
};

// 오늘 작성된 게시글 수 조회
export const getTodayPostCount = async (): Promise<number> => {
  const response = await apiClient.get<{ code: number; data: number; message: string }>('/api/admin/posts/stats/today');
  return response.data.data;
};
