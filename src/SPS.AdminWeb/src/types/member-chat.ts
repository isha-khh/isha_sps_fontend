// ==================== 會員聊天相關類型定義 ====================

/**
 * 聊天室 DTO
 */
export interface ChatRecordDto {
  id: number;
  type: number; // 1=Member↔Member, 2=Member↔Admin
  status: number; // 0=waiting, 1=active, 2=closed
  agentName?: string;
  initiatorMemberId?: string;
  initiatorMemberName?: string;
  initiatorMemberRole?: number;
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

/**
 * 訊息 DTO
 */
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

/**
 * 建立會員聊天請求
 */
export interface CreateChatRequest {
  targetMemberId: string;
}

/**
 * 建立管理員聊天請求
 */
export interface CreateAdminChatRequest {
  adminUserId?: string;
}

// ==================== SignalR 事件類型 ====================

/**
 * 已讀事件
 */
export interface MessagesReadEvent {
  chatRecordId: number;
}

/**
 * 正在輸入事件
 */
export interface UserTypingEvent {
  chatRecordId: number;
  senderType: 'member' | 'admin';
}
