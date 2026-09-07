import { apiClient } from '@/lib/api-client';
import type { SiteStatistics, SetSiteStatisticsRequest } from '@/types/site-statistics';

// ========== 網站統計數據 API ==========
export const siteStatisticsApi = {
  // 取得統計數據（前台用，匿名）
  async getStatistics(): Promise<SiteStatistics> {
    const response = await apiClient.get('/api/site-statistics');
    return response.data;
  },

  // 取得統計數據（後台用）
  async getAdminStatistics(): Promise<SiteStatistics> {
    const response = await apiClient.get('/api/admin/site-statistics');
    return response.data;
  },

  // 設定統計數據（後台用）
  async setStatistics(request: SetSiteStatisticsRequest): Promise<SiteStatistics> {
    const response = await apiClient.put('/api/admin/site-statistics', request);
    return response.data;
  },
};
