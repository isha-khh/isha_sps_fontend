import { apiClient } from '@/lib/api-client';
import type {
  VideoResponse,
  CreateVideoRequest,
  UpdateVideoRequest,
} from '@/types/video';
import type { PagedResponse } from '@/types/api';

export const videosApi = {
  /**
   * 分頁查詢影片列表
   * GET /api/Video
   *
   * 修正：後端 `VideoQueryParameters`（SPS.Application/DTOs/Video）實際
   * 欄位是 `page`，不是 `pageIndex`——原本這個參數名對不上，不會報錯，
   * 只是永遠回傳預設的第一頁（後端對不到參數名就用預設值 `Page = 1`），
   * 跟先前在前台 `fetchFaq()` 抓到的 `pageIndex`/`page` 是同一種坑。
   */
  async getPaged(page = 1, pageSize = 20): Promise<VideoResponse[]> {
    try {
      const response = await apiClient.get<PagedResponse<VideoResponse>>('/api/Video', {
        params: { page, pageSize },
      });
      return response.data.items ?? [];
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      throw error;
    }
  },

  /**
   * 獲取影片詳情
   * GET /api/Video/{id}
   */
  async getById(id: number): Promise<VideoResponse> {
    try {
      const response = await apiClient.get(`/api/Video/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch video details:', error);
      throw error;
    }
  },

  /**
   * 創建影片
   * POST /api/Video
   */
  async create(request: CreateVideoRequest): Promise<VideoResponse> {
    try {
      const response = await apiClient.post('/api/Video', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create video:', error);
      throw error;
    }
  },

  /**
   * 更新影片
   * PUT /api/Video/{id}
   */
  async update(id: number, request: UpdateVideoRequest): Promise<VideoResponse> {
    try {
      const response = await apiClient.put(`/api/Video/${id}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update video:', error);
      throw error;
    }
  },

  /**
   * 刪除影片
   * DELETE /api/Video/{id}
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/Video/${id}`);
    } catch (error) {
      console.error('Failed to delete video:', error);
      throw error;
    }
  },

  /**
   * 根據相簿 ID 獲取影片列表
   * GET /api/Video/album/{albumId}
   */
  async getByAlbumId(albumId: number): Promise<VideoResponse[]> {
    try {
      const response = await apiClient.get(`/api/Video/album/${albumId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch videos by album:', error);
      throw error;
    }
  },
};
