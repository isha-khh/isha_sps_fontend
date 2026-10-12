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
  initiatorCompanyName?: string;
  targetMemberId?: string;
  targetMemberName?: string;
  targetCompanyName?: string;
  targetUserId?: string;
  targetUserName?: string;
  lastMessage?: MessageDto;
  unreadCount: number;
  createdTime: string;
  /** 會員之間的對話（type=1）綁定的需求 */
  demandId?: number | null;
  demandName?: string | null;
  /** 我封鎖了對方 */
  blockedByMe?: boolean;
  /** 目前不能傳訊息（我封鎖了對方或對方封鎖了我，不透露是哪一種） */
  sendBlocked?: boolean;
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
