export interface ChatRoom {
  roomId: string;
  counterpartId: number | null;
  counterpartNickname: string;
  latestSequence: number;
  readThrough: number;
  counterpartReadThrough: number;
  unread: boolean;
  canSend: boolean;
  updatedAt: string;
  preview: string | null;
}
export interface ChatMessage {
  roomId: string;
  sequence: number;
  senderId: number | null;
  body: string;
  contextHref: string | null;
  createdAt: string;
}
export interface ChatSend {
  recipientId: number;
  requestId: string;
  body: string;
  contextType?: 'POST' | 'REPORT';
  contextId?: number;
}
export interface ChatReceipt {
  requestId: string;
  roomId: string;
  sequence: number;
}
export interface ChatSignal {
  memberId: number;
  kind: 'SENT' | 'MESSAGE' | 'READ' | 'HIDDEN';
  roomId: string;
  sequence: number;
}
