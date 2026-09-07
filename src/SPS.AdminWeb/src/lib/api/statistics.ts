import { apiClient } from '@/lib/api-client';
import type { ActionLogStatistics } from '@/types/statistics';

/**
 * 統計分析 API
 */
export const statisticsApi = {
  /**
   * 獲取操作日誌統計資料
   * @param startDate 開始日期 (YYYY-MM-DD)
   * @param endDate 結束日期 (YYYY-MM-DD)
   */
  async getActionLogStatistics(
    startDate?: string,
    endDate?: string
  ): Promise<ActionLogStatistics> {
    const response = await apiClient.get('/api/Log/action/statistics', {
      params: {
        startDate,
        endDate,
      },
    });
    return response.data;
  },
};
