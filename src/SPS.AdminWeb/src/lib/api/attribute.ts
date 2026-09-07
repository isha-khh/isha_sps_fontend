
import { apiClient } from '@/lib/api-client';
import type {
  AttributeDto,
  CreateAttributeRequest,
  UpdateAttributeRequest,
} from '@/types/attribute';
import type { PagedResponse } from '@/types/api';

export const attributesApi = {
  /**
   * 分頁查詢屬性列表
   * GET /api/Attribute
   */
  async getAttributes(params?: { type?: number; search?: string; page?: number; pageSize?: number }): Promise<PagedResponse<AttributeDto>> {
    const response = await apiClient.get('/api/Attribute', { params });
    return response.data;
  },

  /**
   * 根據類型獲取屬性列表
   * GET /api/Attribute/type/{type}
   */
  async getAttributesByType(type: number): Promise<AttributeDto[]> {
    const response = await apiClient.get(`/api/Attribute/type/${type}`);
    return response.data;
  },

  /**
   * 獲取屬性詳情
   * GET /api/Attribute/{id}
   */
  async getAttributeById(id: number): Promise<AttributeDto> {
    const response = await apiClient.get(`/api/Attribute/${id}`);
    return response.data;
  },

  /**
   * 創建屬性
   * POST /api/Attribute
   */
  async createAttribute(request: CreateAttributeRequest): Promise<AttributeDto> {
    const response = await apiClient.post('/api/Attribute', request);
    return response.data;
  },

  /**
   * 更新屬性
   * PUT /api/Attribute/{id}
   */
  async updateAttribute(id: number, request: UpdateAttributeRequest): Promise<AttributeDto> {
    const response = await apiClient.put(`/api/Attribute/${id}`, request);
    return response.data;
  },

  /**
   * 刪除屬性
   * DELETE /api/Attribute/{id}
   */
  async deleteAttribute(id: number): Promise<void> {
    await apiClient.delete(`/api/Attribute/${id}`);
  },
};
