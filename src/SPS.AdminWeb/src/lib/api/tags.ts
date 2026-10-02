import { apiClient } from '@/lib/api-client';
import type { PagedResponse } from '@/types/api';
import type { Tag, CreateTagRequest, UpdateTagRequest } from '@/types/taxonomy';

// ========== 標籤 API (TagController) ==========
export const tagsApi = {
  /** 分頁查詢；後端參數是 `Name`（名稱包含）、`Type`、`Page`、`PageSize`，不是 search */
  async getPaged(params: { type?: number; name?: string; page?: number; pageSize?: number } = {}): Promise<PagedResponse<Tag>> {
    // 後端 QueryParameters.Descending 預設是 true（排序由大到小），標籤清單要依排序值由小到大
    const response = await apiClient.get<PagedResponse<Tag>>('/api/Tag', { params: { descending: false, ...params } });
    return response.data;
  },

  async getTagById(id: number): Promise<Tag> {
    const response = await apiClient.get(`/api/Tag/${id}`);
    return response.data;
  },

  async createTag(request: CreateTagRequest): Promise<Tag> {
    const response = await apiClient.post('/api/Tag', request);
    return response.data;
  },

  async updateTag(id: number, request: UpdateTagRequest): Promise<Tag> {
    const response = await apiClient.put(`/api/Tag/${id}`, request);
    return response.data;
  },

  async deleteTag(id: number): Promise<void> {
    await apiClient.delete(`/api/Tag/${id}`);
  },
};