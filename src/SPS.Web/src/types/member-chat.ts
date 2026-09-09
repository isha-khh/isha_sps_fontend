// ==================== 會員聊天相關類型定義 ====================

/**
 * 聊天室 DTO
 */
export interface ChatRecordDto {
  id: number;
  type: number; // 1=會員↔會員, 2=會員↔客服
  status: number; // 0=待領收(waiting), 1=進行中(active), 2=已結束(closed)
  agentName?: string; // 領收的客服名稱（status=1 時有值）
  initiatorMemberId?: string;
  initiatorMemberName?: string;
  targetMemberId?: string;
  targetMemberName?: string;
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
  text?: string;
  isRead: boolean;
  createdTime: string;
  senderAvatarUrl?: string | null;
}

/**
 * 建立會員聊天請求
 */
export interface CreateChatRequest {
  targetMemberId: string;
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

/**
 * 系統訊息事件
 */
export interface SystemMessageEvent {
  chatRecordId: number;
  text: string;
}
