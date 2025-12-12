import apiClient from './client';
import type {
  CreatePostRequest,
  UpdatePostRequest,
  PostResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentResponse,
} from '../types/api.types';

// ========== 게시글 API ==========

/**
 * 게시글 생성 (로그인 필요)
 * multipart/form-data 전송
 */
export const createPost = async (
  data: CreatePostRequest,
  files?: File[]
): Promise<PostResponse> => {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('content', data.content);
  formData.append('boardType', data.boardType);

  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('files', file);
    });
  }

  const response = await apiClient.post<{
    code: number;
    message: string;
    data: PostResponse;
  }>('/api/v1/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
};

/**
 * 게시글 수정 (로그인 필요)
 * multipart/form-data 전송
 */
export const updatePost = async (
  postId: number,
  data: UpdatePostRequest,
  files?: File[]
): Promise<PostResponse> => {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('content', data.content);

  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('files', file);
    });
  }

  const response = await apiClient.put<{
    code: number;
    message: string;
    data: PostResponse;
  }>(`/api/v1/posts/${postId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
};

/**
 * 게시글 삭제 (로그인 필요)
 */
export const deletePost = async (postId: number): Promise<void> => {
  await apiClient.delete<{
    code: number;
    message: string;
    data: null;
  }>(`/api/v1/posts/${postId}`);
};

/**
 * 게시글 단건 조회 (공개 API)
 */
export const getPost = async (postId: number): Promise<PostResponse> => {
  const response = await apiClient.get<{
    code: number;
    message: string;
    data: PostResponse;
  }>(`/api/v1/posts/read/${postId}`);

  return response.data.data;
};

/**
 * 게시글 목록 조회 (공개 API)
 */
export const getAllPosts = async (): Promise<PostResponse[]> => {
  const response = await apiClient.get<{
    code: number;
    message: string;
    data: PostResponse[];
  }>('/api/v1/posts/read');

  return response.data.data;
};

/**
 * 게시글 검색 (공개 API)
 */
export const searchPosts = async (keyword: string): Promise<PostResponse[]> => {
  const response = await apiClient.get<{
    code: number;
    message: string;
    data: PostResponse[];
  }>('/api/v1/posts/search', {
    params: { keyword },
  });

  return response.data.data;
};

// ========== 댓글 API ==========

/**
 * 댓글 생성 (로그인 필요)
 */
export const createComment = async (
  postId: number,
  data: CreateCommentRequest
): Promise<CommentResponse> => {
  const response = await apiClient.post<{
    code: number;
    message: string;
    data: CommentResponse;
  }>(`/api/v1/comments/posts/${postId}`, data);

  return response.data.data;
};

/**
 * 댓글 수정 (로그인 필요)
 */
export const updateComment = async (
  commentId: number,
  data: UpdateCommentRequest
): Promise<CommentResponse> => {
  const response = await apiClient.put<{
    code: number;
    message: string;
    data: CommentResponse;
  }>(`/api/v1/comments/${commentId}`, data);

  return response.data.data;
};

/**
 * 댓글 삭제 (로그인 필요)
 */
export const deleteComment = async (commentId: number): Promise<void> => {
  await apiClient.delete<{
    code: number;
    message: string;
    data: null;
  }>(`/api/v1/comments/${commentId}`);
};

/**
 * 특정 게시글의 댓글 목록 조회 (공개 API)
 */
export const getCommentsByPostId = async (
  postId: number
): Promise<CommentResponse[]> => {
  const response = await apiClient.get<{
    code: number;
    message: string;
    data: CommentResponse[];
  }>(`/api/v1/comments/posts/read/${postId}`);

  return response.data.data;
};
