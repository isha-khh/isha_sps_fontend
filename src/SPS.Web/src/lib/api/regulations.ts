
import { apiClient } from '@/lib/api-client';
import type {
  RegulationsResponse,
  CreateRegulationsRequest,
  UpdateRegulationsRequest,
} from '@/types/regulations';
import type { PagedResponse } from '@/types/api';

export const regulationsApi = {
  /**
   * 獲取法規分頁列表
   * GET /api/Regulations
   */
  async getPaged(pageIndex = 1, pageSize = 20): Promise<RegulationsResponse[]> {
    try {
      const response = await apiClient.get<PagedResponse<RegulationsResponse>>('/api/Regulations', {
        params: { pageIndex, pageSize },
      });
      return response.data.items ?? [];
    } catch (error) {
      console.error('Failed to fetch regulations:', error);
      throw error;
    }
  },

  /**
   * 獲取法規詳情
   * GET /api/Regulations/{id}
   */
  async getById(id: number): Promise<RegulationsResponse> {
    try {
      const response = await apiClient.get(`/api/Regulations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch regulation details:', error);
      throw error;
    }
  },

  /**
   * 根據類型獲取法規列表
   * GET /api/Regulations/type/{type}
   */
  async getByType(type: number): Promise<RegulationsResponse[]> {
    try {
      const response = await apiClient.get(`/api/Regulations/type/${type}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch regulations by type:', error);
      throw error;
    }
  },

  /**
   * 根據分類獲取法規列表
   * GET /api/Regulations/category/{categoryId}
   */
  async getByCategory(categoryId: number): Promise<RegulationsResponse[]> {
    try {
      const response = await apiClient.get(`/api/Regulations/category/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch regulations by category:', error);
      throw error;
    }
  },

  /**
   * 創建法規
   * POST /api/Regulations
   */
  async create(request: CreateRegulationsRequest): Promise<RegulationsResponse> {
    try {
      const response = await apiClient.post('/api/Regulations', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create regulation:', error);
      throw error;
    }
  },

  /**
   * 更新法規
   * PUT /api/Regulations/{id}
   */
  async update(id: number, request: UpdateRegulationsRequest): Promise<RegulationsResponse> {
    try {
      const response = await apiClient.put(`/api/Regulations/${id}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update regulation:', error);
      throw error;
    }
  },

  /**
   * 刪除法規
   * DELETE /api/Regulations/{id}
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/Regulations/${id}`);
    } catch (error) {
      console.error('Failed to delete regulation:', error);
      throw error;
    }
  },
};
