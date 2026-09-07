import { apiClient } from '@/lib/api-client';
import type {
  PopupAnnouncement,
  PopupAnnouncementListItem,
  CreatePopupAnnouncementRequest,
  UpdatePopupAnnouncementRequest,
  PopupAnnouncementSearchParams,
} from '@/types/popup-announcement';
import type { PagedResponse } from '@/types/api';

// ========== 彈窗公告 API ==========
export const popupAnnouncementApi = {
  // 取得指定路由的有效彈窗公告（前台用）
  async getActiveByRoute(route: string = '/'): Promise<PopupAnnouncement[]> {
    const response = await apiClient.get('/api/popup-announcements/active', {
      params: { route },
    });
    return response.data;
  },

  // 分頁查詢（後台）
  async getPopupAnnouncements(
    pageIndex = 1,
    pageSize = 20,
    params?: PopupAnnouncementSearchParams
  ): Promise<PagedResponse<PopupAnnouncementListItem>> {
    const response = await apiClient.get('/api/admin/popup-announcements', {
      params: {
        Page: pageIndex,
        PageSize: pageSize,
        Search: params?.search,
        Published: params?.published,
        Route: params?.route,
      },
    });
    return response.data;
  },

  // 取得詳情
  async getById(id: number): Promise<PopupAnnouncement> {
    const response = await apiClient.get(`/api/admin/popup-announcements/${id}`);
    return response.data;
  },

  // 新增
  async create(request: CreatePopupAnnouncementRequest): Promise<PopupAnnouncement> {
    const response = await apiClient.post('/api/admin/popup-announcements', request);
    return response.data;
  },

  // 更新
  async update(id: number, request: UpdatePopupAnnouncementRequest): Promise<PopupAnnouncement> {
    const response = await apiClient.put(`/api/admin/popup-announcements/${id}`, request);
    return response.data;
  },

  // 刪除
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/admin/popup-announcements/${id}`);
  },

  // 切換發布狀態
  async togglePublish(id: number, published: boolean): Promise<PopupAnnouncement> {
    return this.update(id, { published });
  },
};
