import type { ChatMessage } from '../types/memberChat';

// Deployment remains a separate approval: expose UI only with an explicit environment flag.
export const memberChatEnabled = import.meta.env?.VITE_MEMBER_CHAT_ENABLED === 'true';

export function chatSocketUrl(apiBase: string, origin: string) {
  const url = new URL('/api/chats/socket', apiBase || origin);
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
