import apiClient from './client';
import type { ChatMessage, ChatRoom } from '../types/memberChat';

const base = '/api/chats';
export async function getChatRooms(cursor?: string, signal?: AbortSignal) {
  return (await apiClient.get<{ data: { content: ChatRoom[]; nextCursor: string | null } }>(base, {
    params: { cursor }, signal,
  })).data.data;
}
export async function getChatRoom(room: string, signal?: AbortSignal) {
  return (await apiClient.get<{ data: ChatRoom }>(`${base}/${room}`, { signal })).data.data;
}
export async function getChatMessages(room: string, before?: number, after?: number, signal?: AbortSignal) {
  return (await apiClient.get<{ data: {
    content: ChatMessage[]; nextCursor: number | null; counterpartReadThrough: number;
  } }>(`${base}/${room}/messages`, { params: { before, after }, signal })).data.data;
}
export async function getChatNotifications(cursor?: string, signal?: AbortSignal) {
  return (await apiClient.get<{ data: { content: ChatRoom[]; nextCursor: string | null; unreadCount: number } }>(
    `${base}/notifications`, { params: { cursor }, signal },
  )).data.data;
}
export async function issueChatTicket(signal: AbortSignal) {
  return (await apiClient.post<{ data: { ticket: string; expiresAt: number } }>(
    `${base}/connection-ticket`, {}, { signal },
  )).data.data;
}
export async function readChat(room: string, sequence: number) {
  await apiClient.put(`${base}/${room}/read`, { sequence });
}
export async function hideChat(room: string) {
  await apiClient.delete(`${base}/${room}/visibility`);
}
