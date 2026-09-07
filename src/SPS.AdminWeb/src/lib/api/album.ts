import { apiClient } from '@/lib/api-client';
import type {
  AlbumResponse,
  CreateAlbumRequest,
  UpdateAlbumRequest,
} from '@/types/album';
import type { PagedResponse } from '@/types/api';

export const albumApi = {
  /**
   * 分頁查詢相簿列表
   * GET /api/Album
   */
  async getPaged(pageIndex = 1, pageSize = 20): Promise<AlbumResponse[]> {
    try {
      const response = await apiClient.get<PagedResponse<AlbumResponse>>('/api/Album', {
        params: { pageIndex, pageSize },
      });
      return response.data.items ?? [];
    } catch (error) {
      console.error('Failed to fetch albums:', error);
      throw error;
    }
  },

  /**
   * 獲取相簿詳情
   * GET /api/Album/{id}
   */
  async getById(id: number): Promise<AlbumResponse> {
    try {
      const response = await apiClient.get(`/api/Album/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch album details:', error);
      throw error;
    }
  },

  /**
   * 創建相簿
   * POST /api/Album
   */
  async create(request: CreateAlbumRequest): Promise<AlbumResponse> {
    try {
      const response = await apiClient.post('/api/Album', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create album:', error);
      throw error;
    }
  },

  /**
   * 更新相簿
   * PUT /api/Album/{id}
   */
  async update(id: number, request: UpdateAlbumRequest): Promise<AlbumResponse> {
    try {
      const response = await apiClient.put(`/api/Album/${id}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update album:', error);
      throw error;
    }
  },

  /**
   * 刪除相簿
   * DELETE /api/Album/{id}
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/Album/${id}`);
    } catch (error) {
      console.error('Failed to delete album:', error);
      throw error;
    }
  },
};
