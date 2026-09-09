import { apiClient } from '@/lib/api-client';
import type {
  News,
  CreateNewsRequest,
  UpdateNewsRequest,
  NewsSearchParams,
  NewsStatistics,
} from '@/types/news';
import type { PagedResponse } from '@/types/api';



// ========== 公告 API (Legacy Compat) ==========
export const newsApi = {
  // 獲取公告列表
  async getNews(
    pageIndex = 1,
    pageSize = 20,
    params?: NewsSearchParams
  ): Promise<PagedResponse<News>> {
    try {
      const response = await apiClient.get('/api/News', {
        params: {
          Page: pageIndex,
          PageSize: pageSize,
          Search: params?.search,
          CategoryId: params?.categoryId,
          Type: params?.type,
          Published: params?.published,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch news:', error);
      throw error;
    }
  },

  // 獲取公告詳情
  async getNewsById(id: number): Promise<News> {
    try {
      const response = await apiClient.get(`/api/News/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch news:', error);
      throw error;
    }
  },

  // 創建公告
  async createNews(request: CreateNewsRequest): Promise<News> {
    try {
      const response = await apiClient.post('/api/News', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create news:', error);
      throw error;
    }
  },

  // 更新公告
  async updateNews(id: number, request: UpdateNewsRequest): Promise<News> {
    try {
      const response = await apiClient.put(`/api/News/${id}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update news:', error);
      throw error;
    }
  },

  // 刪除公告
  async deleteNews(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/News/${id}`);
    } catch (error) {
      console.error('Failed to delete news:', error);
      throw error;
    }
  },

  // 切換發布狀態
  async togglePublish(id: number, published: boolean): Promise<News> {
    try {
      const current = await this.getNewsById(id);
      const updateRequest: UpdateNewsRequest = {
        ...current,
        published,
      };
      return await this.updateNews(id, updateRequest);
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      throw error;
    }
  },

  // 記錄瀏覽次數（統計用）
  async recordView(id: number): Promise<void> {
    try {
      await apiClient.post(`/api/News/${id}/view`);
    } catch (error) {
      // 靜默失敗，不影響用戶體驗
      console.error('Failed to record news view:', error);
    }
  },

  // 獲取統計數據
  async getStatistics(): Promise<NewsStatistics> {
    // ✅ Backend implemented: 2026-01-14
    // 📖 Endpoint: GET /api/News/statistics
    try {
      const response = await apiClient.get('/api/News/statistics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch news statistics:', error);
      throw error;
    }
  },
};
