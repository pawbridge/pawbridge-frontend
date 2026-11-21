import type { ChatMessage, ChatSignal } from '../types/memberChat';

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

const chatSignalKinds: readonly string[] = ['SENT', 'MESSAGE', 'READ', 'HIDDEN'];

// 서버가 보낸 본문 없는 채팅 신호를 확인한다. 웹소켓 프레임과 쪽지 알림 스트림의 chat 이벤트가 같은 모양이다.
// 모양이 다르거나 다른 회원 앞으로 온 값은 null이다.
export function chatSignalFor(value: unknown, owner: number): ChatSignal | null {
  if (typeof value !== 'object' || value === null) return null;
  const { memberId, kind, roomId, sequence } = value as Record<string, unknown>;
  if (memberId !== owner || typeof kind !== 'string' || !chatSignalKinds.includes(kind)) return null;
  if (typeof roomId !== 'string' || !roomId) return null;
  if (typeof sequence !== 'number' || !Number.isSafeInteger(sequence) || sequence < 0) return null;
  return { memberId, kind: kind as ChatSignal['kind'], roomId, sequence };
}

// 방마다 마지막으로 알린 순번을 기억한다. 같은 새 메시지 신호가 웹소켓과 쪽지 알림 스트림으로
// 두 번 오거나 다시 와도 처음 한 번만 true다.
export function isNewChatMessage(known: Map<string, number>, signal: ChatSignal, limit = 1024) {
  if (signal.kind !== 'MESSAGE' || signal.sequence <= (known.get(signal.roomId) ?? 0)) return false;
  known.set(signal.roomId, signal.sequence);
  while (known.size > limit) known.delete(known.keys().next().value!);
  return true;
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
