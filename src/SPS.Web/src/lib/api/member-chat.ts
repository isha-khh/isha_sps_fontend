import { apiClient } from '@/lib/api-client';
import type { ChatRecordDto, MessageDto } from '@/types/member-chat';


// ==================== 會員聊天 API ====================

export const memberChatApi = {
  /**
   * 取得會員聊天列表
   * GET /api/member-chat/list
   */
  async getChatList(): Promise<ChatRecordDto[]> {
    const response = await apiClient.get<ChatRecordDto[]>('/api/member-chat/list');
    return response.data;
  },

  /**
   * 取得聊天訊息歷史
   * GET /api/member-chat/{chatRecordId}/messages
   */
  async getMessages(chatRecordId: number, skip = 0, take = 50): Promise<MessageDto[]> {
    const response = await apiClient.get<MessageDto[]>(
      `/api/member-chat/${chatRecordId}/messages`,
      { params: { skip, take } }
    );
    return response.data;
  },

  /**
   * 建立會員↔管理員聊天室
   * POST /api/member-chat/create-admin
   */
  async createAdminChat(): Promise<ChatRecordDto> {
    const response = await apiClient.post<ChatRecordDto>('/api/member-chat/create-admin');
    return response.data;
  },

  /**
   * 取得總未讀數
   * GET /api/member-chat/unread-count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<number>('/api/member-chat/unread-count');
    return response.data;
  },
};
