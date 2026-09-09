import { apiClient } from '@/lib/api-client';
import type { SiteCounter } from '@/types/site-counter';

export const siteCounterApi = {
    /**
     * 取得網站計數
     * GET /api/site-counter
     */
    async getCounter(): Promise<SiteCounter> {
        try {
            const response = await apiClient.get<SiteCounter>('/api/site-counter');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch site counter:', error);
            return { totalVisitors: 0, totalPageViews: 0 };
        }
    },

    /**
     * 記錄訪問
     * POST /api/site-counter/visit?isNewVisitor={isNewVisitor}
     */
    async recordVisit(isNewVisitor: boolean): Promise<void> {
        try {
            await apiClient.post('/api/site-counter/visit', null, {
                params: { isNewVisitor },
            });
        } catch (error) {
            console.error('Failed to record site visit:', error);
        }
    },
};
