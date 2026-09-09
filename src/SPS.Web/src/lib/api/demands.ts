import { apiClient } from '@/lib/api-client';
import type {
  Demand,
  CreateDemandRequest,
  UpdateDemandRequest,
  DemandSearchParams,
  DemandStatistics,
} from '@/types/demand';
import type { PagedResponse } from '@/types/api';




// ========== 需求 API (Legacy Compat) ==========
export const demandsApi = {
  // 獲取需求列表
  async getDemands(
    pageIndex = 1,
    pageSize = 20,
    params?: DemandSearchParams
  ): Promise<PagedResponse<Demand>> {
    try {
      const response = await apiClient.get('/api/Demand', {
        params: {
          Page: pageIndex,
          PageSize: pageSize,
          Search: params?.search,
          CompanyId: params?.companyId,
          Published: params?.published,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch demands:', error);
      throw error;
    }
  },

  // 獲取需求詳情
  async getDemandById(id: string): Promise<Demand> {
    try {
      const response = await apiClient.get(`/api/Demand/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch demand:', error);
      throw error;
    }
  },

  // 創建需求
  async createDemand(request: CreateDemandRequest): Promise<Demand> {
    try {
      const response = await apiClient.post('/api/Demand', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create demand:', error);
      throw error;
    }
  },

  // 更新需求
  async updateDemand(id: string, request: UpdateDemandRequest): Promise<Demand> {
    try {
      const response = await apiClient.put(`/api/Demand/${id}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update demand:', error);
      throw error;
    }
  },

  // 刪除需求
  async deleteDemand(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/Demand/${id}`);
    } catch (error) {
      console.error('Failed to delete demand:', error);
      throw error;
    }
  },

  // 切換發布狀態
  async togglePublish(id: string, published: boolean): Promise<Demand> {
    try {
      // UpdateDemandRequest accepts all optional fields, so we can send just the published status.
      // This avoids the race condition from GET-then-UPDATE pattern.
      return await this.updateDemand(id, { published });
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      throw error;
    }
  },

  // 獲取統計數據
  async getStatistics(): Promise<DemandStatistics> {
    // ✅ Backend implemented: 2026-01-14
    // 📖 Endpoint: GET /api/Demand/statistics
    try {
      const response = await apiClient.get('/api/Demand/statistics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch demand statistics:', error);
      throw error;
    }
  },
};
