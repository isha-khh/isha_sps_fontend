import { apiClient } from '@/lib/api-client';
import type {
  SuccessCase,
  CreateSuccessCaseRequest,
  UpdateSuccessCaseRequest,
  SuccessCaseSearchParams,
  SuccessCaseStatistics,
} from '@/types/success-case';
import type { PagedResponse } from '@/types/api';

export const successCasesApi = {
  // 獲取成功案例列表
  async getSuccessCases(
    pageIndex = 1,
    pageSize = 20,
    params?: SuccessCaseSearchParams
  ): Promise<PagedResponse<SuccessCase>> {
    try {
      const response = await apiClient.get('/api/SuccessCase', {
        params: { Page: pageIndex, PageSize: pageSize, ...params },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch success cases:', error);
      throw error;
    }
  },

  // 獲取成功案例詳情
  async getSuccessCaseById(id: number): Promise<SuccessCase> {
    try {
      const response = await apiClient.get(`/api/SuccessCase/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch success case:', error);
      throw error;
    }
  },

  // 創建成功案例
  async createSuccessCase(request: CreateSuccessCaseRequest): Promise<SuccessCase> {
    try {
      const response = await apiClient.post('/api/SuccessCase', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create success case:', error);
      throw error;
    }
  },

  // 更新成功案例
  async updateSuccessCase(id: number, request: UpdateSuccessCaseRequest): Promise<SuccessCase> {
    try {
      const response = await apiClient.put(`/api/SuccessCase/${id}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update success case:', error);
      throw error;
    }
  },

  // 刪除成功案例
  async deleteSuccessCase(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/SuccessCase/${id}`);
    } catch (error) {
      console.error('Failed to delete success case:', error);
      throw error;
    }
  },

  // 切換發布狀態
  async togglePublish(id: number, isPublished: boolean): Promise<SuccessCase> {
    try {
      const response = await apiClient.patch(`/api/SuccessCase/${id}/publish`, isPublished);
      return response.data;
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      throw error;
    }
  },

  // 獲取統計數據
  async getStatistics(): Promise<SuccessCaseStatistics> {
    try {
      const response = await apiClient.get('/api/SuccessCase/statistics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch success case statistics:', error);
      throw error;
    }
  },

  // 增加瀏覽次數
  async incrementViewCount(id: number): Promise<void> {
    try {
      await apiClient.post(`/api/SuccessCase/${id}/view`);
    } catch (error) {
      console.error('Failed to increment view count:', error);
      throw error;
    }
  },
};
