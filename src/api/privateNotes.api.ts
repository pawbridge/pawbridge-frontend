import apiClient from './client';
import type { BlockPage, NoteNotifications, NotePage, PrivateNote, SendNote } from '../types/privateNotes';

const base = '/api/notes';
export async function getNotes(box: 'INBOX' | 'SENT', favorites: boolean, page: number, signal?: AbortSignal) {
  return (await apiClient.get<{ data: NotePage }>(base, { params: { box, favorites, page }, signal })).data.data;
}
export async function getNote(id: string, signal?: AbortSignal) {
  return (await apiClient.get<{ data: PrivateNote }>(`${base}/${id}`, { signal })).data.data;
}
export async function sendNote(input: SendNote) {
  return (await apiClient.post<{ data: { noteId: string } }>(base, input)).data.data;
}
export async function getNoteNotifications(cursor?: string, signal?: AbortSignal) {
  return (await apiClient.get<{ data: NoteNotifications }>(`${base}/notifications`, { params: { cursor }, signal })).data.data;
}
export async function readNote(id: string) { await apiClient.put(`${base}/${id}/read`); }
export async function favoriteNote(id: string, favorite: boolean) { await apiClient.put(`${base}/${id}/favorite`, { favorite }); }
export async function deleteNote(id: string) { await apiClient.delete(`${base}/${id}`); }
export async function getNoteRecipient(id: number, signal?: AbortSignal) {
  return (await apiClient.get<{ data: { userId: number; nickname: string; active: boolean } }>(`${base}/recipients/${id}`, { signal })).data.data;
}
export async function getNoteBlocks(page: number, signal?: AbortSignal) {
  return (await apiClient.get<{ data: BlockPage }>(`${base}/blocks`, { params: { page }, signal })).data.data;
}
export async function blockNoteMember(id: number) { await apiClient.put(`${base}/blocks/${id}`); }
export async function unblockNoteMember(id: number) { await apiClient.delete(`${base}/blocks/${id}`); }
