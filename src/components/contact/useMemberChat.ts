import { createContext, useContext } from 'react';
import type { ChatReceipt, ChatRoom, ChatSend } from '../../types/memberChat';

export interface MemberChatState {
  connected: boolean;
  unread: number;
  notifications: ChatRoom[];
  error: boolean;
  hasMore: boolean;
  loading: boolean;
  send: (input: ChatSend) => Promise<ChatReceipt>;
  refresh: () => Promise<void>;
  more: () => Promise<void>;
  // 채팅 화면이 떠 있는 동안만 웹소켓을 연다. 돌려받은 함수를 부르면 닫는다.
  openSocket: () => () => void;
}
export const MemberChatContext = createContext<MemberChatState | null>(null);
export function useMemberChat() {
  const value = useContext(MemberChatContext);
  if (!value) throw new Error('MemberChatProvider required');
  return value;
}

// 쪽지 알림 스트림이 받은 chat 이벤트의 데이터를 채팅 알림 쪽에 넘기는 길이다.
// 채팅 상태와 따로 둬서, 스트림을 여는 쪽이 채팅 상태가 바뀔 때마다 다시 그려지지 않는다.
export const ChatStreamSignalContext = createContext<(data: string) => void>(() => {});
export function useChatStreamSignal() {
  return useContext(ChatStreamSignalContext);
}
