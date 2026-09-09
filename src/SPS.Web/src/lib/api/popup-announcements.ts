import { apiClient } from '@/lib/api-client';
import type { PopupAnnouncement } from '@/types/popup-announcement';

export const popupAnnouncementsApi = {
    /**
     * 取得指定路由的有效彈跳公告
     * GET /api/popup-announcements/active?route={route}
     */
    async getActive(route: string): Promise<PopupAnnouncement[]> {
        try {
            const response = await apiClient.get<PopupAnnouncement[]>('/api/popup-announcements/active', {
                params: { route },
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch active popup announcements:', error);
            return [];
        }
    },
};
