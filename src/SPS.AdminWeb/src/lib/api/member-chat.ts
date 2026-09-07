import { apiClient } from '@/lib/api-client';
import type { ChatRecordDto, MessageDto } from '@/types/member-chat';


// ==================== 管理員會員聊天 API ====================

export const memberChatApi = {
  /**
   * 取得管理員聊天列表
   * GET /api/admin/member-chat/list
   */
  async getChatList(): Promise<ChatRecordDto[]> {
    const response = await apiClient.get<ChatRecordDto[]>('/api/admin/member-chat/list');
    return response.data;
  },

  /**
   * 取得聊天訊息歷史
   * GET /api/admin/member-chat/{chatRecordId}/messages
   */
  async getMessages(chatRecordId: number, skip = 0, take = 50): Promise<MessageDto[]> {
    const response = await apiClient.get<MessageDto[]>(
      `/api/admin/member-chat/${chatRecordId}/messages`,
      { params: { skip, take } }
    );
    return response.data;
  },

  /**
   * 取得總未讀數
   * GET /api/admin/member-chat/unread-count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<number>('/api/admin/member-chat/unread-count');
    return response.data;
  },

  async getWaitingChats(): Promise<ChatRecordDto[]> {
    const response = await apiClient.get<ChatRecordDto[]>('/api/admin/member-chat/waiting');
    return response.data;
  },

  async claimChat(chatRecordId: number): Promise<ChatRecordDto> {
    const response = await apiClient.post<ChatRecordDto>(`/api/admin/member-chat/${chatRecordId}/claim`);
    return response.data;
  },

  async leaveChat(chatRecordId: number): Promise<ChatRecordDto> {
    const response = await apiClient.post<ChatRecordDto>(`/api/admin/member-chat/${chatRecordId}/leave`);
    return response.data;
  },
};
