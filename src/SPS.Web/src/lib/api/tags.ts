import { apiClient } from '@/lib/api-client';
import type { Tag, CreateTagRequest, UpdateTagRequest } from '@/types/taxonomy';

// ========== 標籤 API (TagController) ==========
export const tagsApi = {
  async getTags(params?: { search?: string; page?: number; pageSize?: number }): Promise<Tag[]> {
    const response = await apiClient.get('/api/Tag', { params });
    // Backend returns PagedResult<TagResponse>, UI expects Tag[]
    if (response.data && response.data.items) {
      return response.data.items;
    }
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