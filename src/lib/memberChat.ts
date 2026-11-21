import type { ChatMessage } from '../types/memberChat';

// Deployment remains a separate approval: expose UI only with an explicit environment flag.
export const memberChatEnabled = import.meta.env?.VITE_MEMBER_CHAT_ENABLED === 'true';

export function existingChatPath(roomId: string, search: URLSearchParams) {
  const context = search.get('context');
  const contextId = search.get('contextId');
  const params = new URLSearchParams();
  if ((context === 'POST' || context === 'REPORT') && contextId !== null
    && /^[1-9]\d*$/.test(contextId) && Number.isSafeInteger(Number(contextId))) {
    params.set('context', context);
    params.set('contextId', contextId);
  }
  return `/chats/${roomId}${params.size ? `?${params}` : ''}`;
}

// 끊긴 뒤 stompjs가 먼저 기다리는 시간.
export const chatReconnectDelayMs = 5000;
const maxChatReconnectWaitMs = 300_000;

// 마지막 연결 성공 뒤 attempt번째 시도 전에 stompjs의 5초에 더해 기다릴 시간.
// 회원당 연결 한도를 넘은 탭은 연결표는 받고 CONNECT에서 거절되므로, 성공 전까지 10초, 20초 … 5분으로 늘린다.
export function chatReconnectExtraWait(attempt: number, random = Math.random) {
  if (attempt <= 0) return 0;
  const total = Math.min(chatReconnectDelayMs * 2 ** attempt, maxChatReconnectWaitMs);
  return total - chatReconnectDelayMs + Math.floor(random() * 1000);
}

export function chatSocketUrl(apiBase: string, origin: string) {
  const url = new URL('/api/v1/chats/socket', apiBase || origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

export function mergeChatMessages(previous: ChatMessage[], incoming: ChatMessage[]) {
  return [...new Map([...previous, ...incoming].map((message) => [message.sequence, message])).values()]
    .sort((left, right) => left.sequence - right.sequence);
}

export function validChatBody(body: string) {
  const value = body.trim();
  return value.length > 0 && Array.from(value).length <= 2000 && !value.includes('\0')
    && !Array.from(value).some((char) => {
      const point = char.codePointAt(0)!;
      return point >= 0xd800 && point <= 0xdfff;
    });
}
