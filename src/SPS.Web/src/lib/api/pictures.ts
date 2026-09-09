import { apiClient } from '@/lib/api-client';
import type {
  PictureResponse,
  CreatePictureRequest,
  UpdatePictureRequest,
} from '@/types/picture';
import type { PagedResponse } from '@/types/api';

export const picturesApi = {
  /**
   * 分頁查詢圖片列表
   * GET /api/Picture
   */
  async getPaged(pageIndex = 1, pageSize = 20): Promise<PictureResponse[]> {
    try {
      const response = await apiClient.get<PagedResponse<PictureResponse>>('/api/Picture', {
        params: { pageIndex, pageSize },
      });
      return response.data.items ?? [];
    } catch (error) {
      console.error('Failed to fetch pictures:', error);
      throw error;
    }
  },

  /**
   * 獲取圖片詳情
   * GET /api/Picture/{id}
   */
  async getById(id: number): Promise<PictureResponse> {
    try {
      const response = await apiClient.get(`/api/Picture/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch picture details:', error);
      throw error;
    }
  },

  /**
   * 創建圖片
   * POST /api/Picture
   */
  async create(request: CreatePictureRequest): Promise<PictureResponse> {
    try {
      const response = await apiClient.post('/api/Picture', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create picture:', error);
      throw error;
    }
  },

  /**
   * 更新圖片
   * PUT /api/Picture/{id}
   */
  async update(id: number, request: UpdatePictureRequest): Promise<PictureResponse> {
    try {
      const response = await apiClient.put(`/api/Picture/${id}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update picture:', error);
      throw error;
    }
  },

  /**
   * 刪除圖片
   * DELETE /api/Picture/{id}
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/Picture/${id}`);
    } catch (error) {
      console.error('Failed to delete picture:', error);
      throw error;
    }
  },

  /**
   * 根據相簿 ID 獲取圖片列表
   * GET /api/Picture/album/{albumId}
   */
  async getByAlbumId(albumId: number): Promise<PictureResponse[]> {
    try {
      const response = await apiClient.get(`/api/Picture/album/${albumId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch pictures by album:', error);
      throw error;
    }
  },
};
