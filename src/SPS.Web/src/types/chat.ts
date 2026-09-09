// ==================== 訪客客服聊天類型（CustomerHub） ====================

export interface ChatAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId?: string;
  senderType: 'visitor' | 'agent';
  senderName: string;
  content: string;
  messageType: string;
  isRead: boolean;
  createdTime?: string;
  senderAvatarUrl?: string | null;
  attachments?: ChatAttachment[];
}

export interface UserSession {
  id: string;
  sessionId: string;
  connectionId?: string;
  gaClientId?: string;
  isOnline: boolean;
  firstConnectedTime: string;
  lastActiveTime: string;
  disconnectedTime?: string;
  userAgent?: string;
  ipAddress?: string;
  utmTags?: string;
  status: string;
  currentPage?: string;
  currentPageTitle?: string;
}

export interface VisitorPageView {
  id: string;
  sessionId: string;
  url: string;
  title?: string;
  viewTime: string;
}

export interface ChatStatistics {
  totalSessions: number;
  onlineSessions: number;
  totalMessages: number;
  unreadMessages: number;
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
  agentId: string;
  agentName: string;
}

export interface MessageReceivedEvent {
  messageId: string;
  sessionId: string;
  senderType: 'visitor' | 'agent';
  senderName: string;
  content: string;
  time: string;
}

export interface UserConnectedEvent {
  sessionId: string;
  connectionId: string;
  gaClientId?: string;
  time: string;
}

export interface UserDisconnectedEvent {
  sessionId: string;
  time: string;
}

export interface UserActivityUpdatedEvent {
  sessionId: string;
  connectionId: string;
  url: string;
  title?: string;
  time: string;
}

// ==================== 會員聊天類型（MemberHub） ====================

export interface ChatRecordDto {
  id: number;
  type: number; // 1=Member↔Member, 2=Member↔Admin
  initiatorMemberId?: string;
  initiatorMemberName?: string;
  targetMemberId?: string;
  targetMemberName?: string;
  initiatorUserId?: string;
  initiatorUserName?: string;
  targetUserId?: string;
  targetUserName?: string;
  lastMessage?: MessageDto;
  unreadCount: number;
  createdTime: string;
}

export interface MessageDto {
  id: number;
  chatRecordId: number;
  senderMemberId?: string;
  senderMemberName?: string;
  senderUserId?: string;
  senderUserName?: string;
  senderType: 'member' | 'admin';
  text?: string;
  isRead: boolean;
  createdTime: string;
}

export interface MessagesReadEvent {
  chatRecordId: number;
}

export interface UserTypingEvent {
  chatRecordId: number;
  senderType: 'member' | 'admin';
}

// ==================== 統一 Tab 類型 ====================

export type ChatTab = 'visitor' | 'member';
