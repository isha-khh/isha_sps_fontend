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
  attachments?: ChatAttachment[];
  senderAvatarUrl?: string | null;
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
  senderAvatarUrl?: string | null;
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
  status: number; // 0=waiting, 1=active, 2=closed
  agentName?: string;
  initiatorMemberId?: string;
  initiatorMemberName?: string;
  initiatorMemberRole?: number; // 1=供給端, 2=需求端
  initiatorCompanyName?: string;
  targetMemberId?: string;
  targetMemberName?: string;
  targetMemberRole?: number;
  targetCompanyName?: string;
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
  senderAvatarUrl?: string;
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

export interface SystemMessageEvent {
  chatRecordId: number;
  text: string;
}

// ==================== 統一 Tab 類型 ====================

export type ChatTab = 'visitor' | 'member';
