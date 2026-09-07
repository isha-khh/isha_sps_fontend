import { apiClient } from '@/lib/api-client';
import type { SystemInfo, HealthStatus } from '@/types/system-info';

export const systemInfoApi = {
  /**
   * 取得系統資訊
   */
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const response = await apiClient.get('/api/SystemInfo');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system info:', error);
      throw error;
    }
  },

  /**
   * 取得健康狀態
   */
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      const response = await apiClient.get('/api/SystemInfo/health');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch health status:', error);
      throw error;
    }
  },
};
