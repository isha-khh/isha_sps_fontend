import { apiClient } from '@/lib/api-client';
import type { SiteStatistics } from '@/types/site-statistics';

export const siteStatisticsApi = {
    /**
     * 取得網站統計數據
     * GET /api/site-statistics
     */
    async getStatistics(): Promise<SiteStatistics> {
        const response = await apiClient.get<SiteStatistics>('/api/site-statistics');
        return response.data;
    },
};
