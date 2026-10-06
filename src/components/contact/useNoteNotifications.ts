import { createContext, useContext } from 'react';
import type { NoteNotification } from '../../types/privateNotes';

export interface NotificationsState {
  items: NoteNotification[]; unread: number; loading: boolean; error: boolean;
  hasMore: boolean; refresh: () => Promise<void>; more: () => Promise<void>;
  toast: NoteNotification | null; dismissToast: () => void;
}
export const NotificationsContext = createContext<NotificationsState | null>(null);
export function useNoteNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('쪽지 알림 공급자가 필요합니다.');
  return context;
}
