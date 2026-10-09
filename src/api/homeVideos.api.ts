import apiClient from './client';
import type { HomeVideo, SaveVideo, VideoBoard, VideoMetadata } from '../types/homeVideos';
const base = '/api/admin/videos';
export async function getHomeVideos(signal?: AbortSignal) {
  return (await apiClient.get<{ data: HomeVideo[] }>('/api/home/videos', { signal })).data.data;
}
export async function getVideoBoard(signal?: AbortSignal) {
  return (await apiClient.get<{ data: VideoBoard }>(base, { signal })).data.data;
}
export async function previewVideo(url: string, signal?: AbortSignal) {
  return (await apiClient.post<{ data: VideoMetadata }>(`${base}/preview`, { url }, { signal })).data.data;
}
export async function saveVideo(id: string | undefined, input: SaveVideo) {
  return (id
    ? await apiClient.put<{ data: VideoBoard }>(`${base}/${id}`, input)
    : await apiClient.post<{ data: VideoBoard }>(base, input)).data.data;
}
export async function publishVideo(id: string, published: boolean, revision: number) {
  return (await apiClient.put<{ data: VideoBoard }>(`${base}/${id}/publication`, { published, revision })).data.data;
}
export async function recheckVideo(id: string, revision: number) {
  return (await apiClient.post<{ data: VideoBoard }>(`${base}/${id}/recheck`, { published: false, revision })).data.data;
}
export async function reorderVideos(ids: string[], revision: number) {
  return (await apiClient.put<{ data: VideoBoard }>(`${base}/order`, { ids, revision })).data.data;
}
