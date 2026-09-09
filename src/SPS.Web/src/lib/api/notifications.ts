import { apiClient } from '@/lib/api-client';
import type {
  NotificationResponse,
  CreateNotificationRequest,

} from '@/types/notification';
import type { PagedResponse } from '@/types/api';

export const notificationsApi = {
  /**
   * 分頁查詢通知列表
   * GET /api/Notification
   */
  async getPaged(pageIndex = 1, pageSize = 20): Promise<NotificationResponse[]> {
    try {
      const response = await apiClient.get<PagedResponse<NotificationResponse>>('/api/Notification', {
        params: { pageIndex, pageSize },
      });
      return response.data.items ?? [];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  },

  /**
   * 獲取通知詳情
   * GET /api/Notification/{id}
   */
  async getById(id: number): Promise<NotificationResponse> {
    try {
      const response = await apiClient.get<NotificationResponse>(`/api/Notification/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notification details:', error);
      throw error;
    }
  },

  /**
   * 創建通知
   * POST /api/Notification
   */
  async create(request: CreateNotificationRequest): Promise<NotificationResponse> {
    try {
      const response = await apiClient.post<NotificationResponse>('/api/Notification', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  },

  /**
   * 標記通知為已讀
   * PUT /api/Notification/{id}/read
   */
  async markAsRead(id: number): Promise<void> {
    try {
      await apiClient.put(`/api/Notification/${id}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  },

  /**
   * 刪除通知
   * DELETE /api/Notification/{id}
   */
  async delete(id: number) {
    try {
      await apiClient.delete(`/api/Notification/${id}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  },

  /**
   * 根據收件人獲取通知列表
   * GET /api/Notification/recipient/{recipient}
   */
  async getByRecipient(recipient: string): Promise<NotificationResponse[]> {
    try {
      const response = await apiClient.get<NotificationResponse[]>(`/api/Notification/recipient/${recipient}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications by recipient:', error);
      throw error;
    }
  },

  /**
   * 獲取未讀通知數量
   * GET /api/Notification/recipient/{recipient}/unread-count
   */
  async getUnreadCount(recipient: string): Promise<number> {
    try {
      const response = await apiClient.get<number>(`/api/Notification/recipient/${recipient}/unread-count`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      throw error;
    }
  },
};
