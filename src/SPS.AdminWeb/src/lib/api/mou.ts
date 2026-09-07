import { apiClient } from '@/lib/api-client';
import type {
  Mou,
  CreateMouRequest,
  UpdateMouRequest,
  MouSearchParams,
  MouStatistics,
  MouStatusType,
} from '@/types/mou';
import type { PagedResponse } from '@/types/api';




// ========== Mou API (Legacy Compat) ==========
export const mouApi = {
  // 獲取 MOU 列表
  async getMous(
    pageIndex = 1,
    pageSize = 20,
    params?: MouSearchParams
  ): Promise<PagedResponse<Mou>> {
    try {
      const response = await apiClient.get('/api/Mou', {
        params: { Page: pageIndex, PageSize: pageSize, ...params },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch MOUs:', error);
      throw error;
    }
  },

  // 獲取 MOU 詳情
  async getMouById(id: number): Promise<Mou> {
    try {
      const response = await apiClient.get(`/api/Mou/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch MOU:', error);
      throw error;
    }
  },

  // 創建 MOU
  async createMou(request: CreateMouRequest): Promise<Mou> {
    try {
      const response = await apiClient.post('/api/Mou', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create MOU:', error);
      throw error;
    }
  },

  // 更新 MOU
  async updateMou(id: number, request: UpdateMouRequest): Promise<Mou> {
    try {
      const response = await apiClient.put(`/api/Mou/${id}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update MOU:', error);
      throw error;
    }
  },

  // 刪除 MOU
  async deleteMou(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/Mou/${id}`);
    } catch (error) {
      console.error('Failed to delete MOU:', error);
      throw error;
    }
  },

  // 更新 MOU 狀態
  async updateMouStatus(id: number, status: MouStatusType): Promise<Mou> {
    try {
      const response = await apiClient.patch(`/api/Mou/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Failed to update MOU status:', error);
      throw error;
    }
  },

  // 獲取統計數據
  async getStatistics(): Promise<MouStatistics> {
    try {
      const response = await apiClient.get('/api/Mou/statistics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch MOU statistics:', error);
      throw error;
    }
  },
};
