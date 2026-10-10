import { createContext, useContext } from 'react';
import type { ChatReceipt, ChatRoom, ChatSend } from '../../types/memberChat';

export interface MemberChatState {
  connected: boolean;
  unread: number;
  notifications: ChatRoom[];
  error: boolean;
  hasMore: boolean;
  loading: boolean;
  toast: ChatRoom | null;
  send: (input: ChatSend) => Promise<ChatReceipt>;
  refresh: () => Promise<void>;
  more: () => Promise<void>;
  dismissToast: () => void;
}
export const MemberChatContext = createContext<MemberChatState | null>(null);
export function useMemberChat() {
  const value = useContext(MemberChatContext);
  if (!value) throw new Error('MemberChatProvider required');
  return value;
}
