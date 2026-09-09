import { apiClient } from '@/lib/api-client';



// ==================== google 分析 API 客戶端 ====================

export const analyticsApi = {
  /**
   * 獲取日期範圍內的完整數據報告
   * GET /api/analytics
   */
  async getReport(startDate?: string, endDate?: string) {
    try {
      const response = await apiClient.get('/api/analytics', {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch analytics report:', error);
      throw error;
    }
  },

  /**
   * 手動觸發數據同步
   * POST /api/analytics/sync
   */
  async sync(days = 1) {
    try {
      const response = await apiClient.post('/api/analytics/sync', null, {
        params: { days },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to sync analytics data:', error);
      throw error;
    }
  },
};
