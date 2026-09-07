import { apiClient } from '@/lib/api-client';
import type {
  UserSession,
  ChatMessage,
  VisitorPageView,
  ChatStatistics
} from '@/types/chat';

// ==================== API 響應類型 ====================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
}

// ==================== Chat API 客戶端 ====================

export const chatApi = {
  /**
   * 獲取所有在線訪客
   * GET /api/Chat/visitors/online
   */
  async getOnlineVisitors(): Promise<UserSession[]> {
    try {
      const response = await apiClient.get<ApiResponse<UserSession[]>>('/api/Chat/visitors/online');
      return response.data.data;
    } catch (error) {
      console.error("未知錯誤:", error);
      if (error instanceof Error) {
        console.error("API 錯誤 :", error.message);
      } else {
        console.error("未知錯誤.");
      }
      throw error;
    }
  },

  /**
   * 獲取訪客會話詳情
   * GET /api/Chat/visitors/{sessionId}
   */
  async getVisitorSession(sessionId: string): Promise<UserSession | null > {
    try {
      const response = await apiClient.get<ApiResponse<UserSession>>(
        `/api/Chat/visitors/${sessionId}`
      );
      return response.data.data;
    } catch (error) {
      console.error("未知錯誤:", error);
      if (error instanceof Error) {
        console.error("API 錯誤 :", error.message);
      } else {
        console.error("未知錯誤.");
      }
      return null;
    }
  },

  /**
   * 獲取聊天歷史
   * GET /api/Chat/messages/{sessionId}?skip=0&limit=50
   */
  async getChatHistory(
    sessionId: string,
    skip = 0,
    limit = 50
  ): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.get<ApiResponse<ChatMessage[]>>(
        `/api/Chat/messages/${sessionId}`,
        {
          params: { skip, limit },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("未知錯誤:", error);
      if (error instanceof Error) {
        console.error("API 錯誤 :", error.message);
      } else {
        console.error("未知錯誤.");
      }
      throw error;
    }
  },

  /**
   * 獲取訪客頁面瀏覽歷史
   * GET /api/Chat/pageviews/{sessionId}
   */
  async getPageViewHistory(sessionId: string): Promise<VisitorPageView[]> {
    try {
      const response = await apiClient.get<ApiResponse<VisitorPageView[]>>(
        `/api/Chat/pageviews/${sessionId}`
      );
      return response.data.data;
    } catch (error) {
      console.error("未知錯誤:", error);
      if (error instanceof Error) {
        console.error("API 錯誤 :", error.message);
      } else {
        console.error("未知錯誤.");
      }
      throw error;
    }
  },

  /**
   * 獲取會話統計
   * GET /api/Chat/statistics
   */
  async getStatistics(): Promise<ChatStatistics> {
    try {
      const response = await apiClient.get<ApiResponse<ChatStatistics>>('/api/Chat/statistics');
      return response.data.data;
    } catch (error) {
      console.error("未知錯誤:", error);
      if (error instanceof Error) {
        console.error("API 錯誤 :", error.message);
      } else {
        console.error("未知錯誤.");
      }
      throw error;
    }
  },

  /**
   * 獲取未讀消息數量
   * GET /api/Chat/unread/{sessionId}
   */
  async getUnreadMessageCount(sessionId: string): Promise<number> {
    try {
      const response = await apiClient.get<ApiResponse<{ sessionId: string; unreadCount: number }>>(
        `/api/Chat/unread/${sessionId}`
      );
      return response.data.data.unreadCount;
    } catch (error) {
      console.error("未知錯誤:", error);
      if (error instanceof Error) {
        console.error("API 錯誤 :", error.message);
      } else {
        console.error("未知錯誤.");
      }
      throw error;
    }
  },

  // 別名：為了兼容性
  async getMessages(sessionId: string, skip = 0, limit = 50): Promise<ChatMessage[]> {
    return this.getChatHistory(sessionId, skip, limit);
  },
};
