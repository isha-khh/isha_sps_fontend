import { apiClient } from '@/lib/api-client';



// ==================== google 分析 API 客戶端 ====================

/** 自動同步的設定與最近一次同步結果（GET /api/analytics/sync-status） */
export interface AnalyticsSyncStatus {
  /** Google Analytics 的資源 ID 與憑證是否都已設定 */
  configured: boolean;
  autoSyncEnabled: boolean;
  autoSyncTime: string;
  autoSyncDays: number;
  lastRunUtc?: string | null;
  lastSuccess?: boolean | null;
  lastSuccessUtc?: string | null;
  lastMessage?: string | null;
  /** auto＝排程、manual＝儀表板按鈕 */
  lastTrigger?: 'auto' | 'manual' | null;
  lastDays: number;
}

export const analyticsApi = {
  /**
   * 自動同步設定與最近一次同步結果
   * GET /api/analytics/sync-status
   */
  async getSyncStatus(): Promise<AnalyticsSyncStatus> {
    const response = await apiClient.get<AnalyticsSyncStatus>('/api/analytics/sync-status');
    return response.data;
  },

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
