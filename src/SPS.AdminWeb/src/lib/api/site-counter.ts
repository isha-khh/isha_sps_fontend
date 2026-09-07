import { apiClient } from '@/lib/api-client';
import type { SiteCounter, SetSiteCounterRequest } from '@/types/site-counter';

// ========== 網站計數器 API ==========
export const siteCounterApi = {
  // 取得計數（前台用，匿名）
  async getCounter(): Promise<SiteCounter> {
    const response = await apiClient.get('/api/site-counter');
    return response.data;
  },

  // 記錄訪問（前台用）
  async recordVisit(isNewVisitor: boolean = false): Promise<SiteCounter> {
    const response = await apiClient.post('/api/site-counter/visit', null, {
      params: { isNewVisitor },
    });
    return response.data;
  },

  // 取得計數（後台用）
  async getAdminCounter(): Promise<SiteCounter> {
    const response = await apiClient.get('/api/admin/site-counter');
    return response.data;
  },

  // 設定計數（後台用）
  async setCounter(request: SetSiteCounterRequest): Promise<SiteCounter> {
    const response = await apiClient.put('/api/admin/site-counter', request);
    return response.data;
  },
};
