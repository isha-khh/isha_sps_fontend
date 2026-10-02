import { apiClient } from '@/lib/api-client';
import type {
  BannerPositionResponse,
  BannerResponse,
  CreateBannerRequest,
  UpdateBannerRequest,
} from '@/types/banner';
import type { PagedResponse } from '@/types/api';

export const bannerApi = {
  /**
   * 分頁查詢 Banner 列表
   * GET /api/Banner
   */
  async getPaged(page = 1, pageSize = 100): Promise<BannerResponse[]> {
    try {
      // 後端查詢參數是 `Page`/`PageSize`（QueryParameters），原本這裡送的 `pageIndex` 後端不認得，
      // 一律退回預設每頁 20 筆，第 21 筆之後的 Banner 在後台完全看不到
      const response = await apiClient.get<PagedResponse<BannerResponse>>('/api/Banner', {
        params: { page, pageSize },
      });
      return response.data.items ?? [];
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      throw error;
    }
  },

  /**
   * 獲取 Banner 詳情
   * GET /api/Banner/{id}
   */
  async getById(id: number): Promise<BannerResponse> {
    try {
      const response = await apiClient.get<BannerResponse>(`/api/Banner/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch banner details:', error);
      throw error;
    }
  },

  /**
   * 創建 Banner
   * POST /api/Banner
   */
  async create(request: CreateBannerRequest): Promise<BannerResponse> {
    try {
      const response = await apiClient.post<BannerResponse>('/api/Banner', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create banner:', error);
      throw error;
    }
  },

  /**
   * 更新 Banner
   * PUT /api/Banner/{id}
   */
  async update(id: number, request: UpdateBannerRequest): Promise<BannerResponse> {
    try {
      const response = await apiClient.put<BannerResponse>(`/api/Banner/${id}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update banner:', error);
      throw error;
    }
  },

  /**
   * 刪除 Banner
   * DELETE /api/Banner/{id}
   */
  async delete(id: number) {
    try {
      await apiClient.delete(`/api/Banner/${id}`);
    } catch (error) {
      console.error('Failed to delete banner:', error);
      throw error;
    }
  },

  /**
   * 根據位置 ID 獲取 Banner 列表
   * GET /api/Banner/position/{positionId}
   */
  async getByPositionId(positionId: number): Promise<BannerResponse[]> {
    try {
      // 後端回的是純陣列（只含上架中的），不是分頁包裝，原本讀 `.items` 會永遠拿到空陣列
      const response = await apiClient.get<BannerResponse[]>(`/api/Banner/position/${positionId}`);
      return response.data ?? [];
    } catch (error) {
      console.error('Failed to fetch banners by position:', error);
      throw error;
    }
  },

  /**
   * 取得所有固定版位（新增/編輯 Banner 的版位下拉）
   * GET /api/Banner/positions
   */
  async getPositions(): Promise<BannerPositionResponse[]> {
    const response = await apiClient.get<BannerPositionResponse[]>('/api/Banner/positions');
    return response.data ?? [];
  },

  /**
   * 增加 Banner 檢視次數
   * POST /api/Banner/{id}/view
   */
  async incrementViewCount(id: number): Promise<void> {
    try {
      await apiClient.post(`/api/Banner/${id}/view`);
    } catch (error) {
      console.error('Failed to increment banner view count:', error);
      throw error;
    }
  },

  /**
   * 增加 Banner 點擊次數
   * POST /api/Banner/{id}/click
   */
  async incrementClickCount(id: number): Promise<void> {
    try {
      await apiClient.post(`/api/Banner/${id}/click`);
    } catch (error) {
      console.error('Failed to increment banner click count:', error);
      throw error;
    }
  },
};
