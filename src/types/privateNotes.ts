export interface PrivateNote {
  noteId: string;
  body: string;
  direction: 'INBOX' | 'SENT';
  createdAt: string;
  readAt: string | null;
  favorite: boolean;
  counterpartId: number | null;
  counterpartNickname: string;
  canReply: boolean;
  contextHref: string | null;
}
export interface NoteNotification {
  noteId: string;
  kind: 'PRIVATE_NOTE';
  actorId: number | null;
  actorNickname: string;
  createdAt: string;
  read: boolean;
  href: string;
}
export interface NoteNotifications {
  content: NoteNotification[];
  nextCursor: string | null;
  unreadCount: number;
}
export interface SendNote {
  recipientId: number;
  body: string;
  requestId: string;
  replyTo?: string;
  contextType?: 'POST' | 'REPORT';
  contextId?: number;
}
export interface NotePage {
  content: PrivateNote[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
export interface BlockPage {
  content: { memberId: number; nickname: string; createdAt: string }[];
  totalElements: number;
  totalPages: number;
  number: number;
}
