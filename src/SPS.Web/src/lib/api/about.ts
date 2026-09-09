import { apiClient } from '@/lib/api-client';
import type {
  Banner,
  Link,
  Page,
  EmailTemplate,
  Album,
} from '@/types/content';
import type {
  AboutResponse,
  CreateAboutRequest,
  UpdateAboutRequest,
} from '@/types/about';
import type { PagedResponse } from '@/types/api';

export const aboutApi = {
  /**
   * 獲取關於我們分頁列表
   * GET /api/About
   */
  async getPaged(pageIndex = 1, pageSize = 20): Promise<AboutResponse[]> {
    try {
      const response = await apiClient.get<PagedResponse<AboutResponse>>('/api/About', {
        params: { pageIndex, pageSize },
      });
      return response.data.items ?? [];
    } catch (error) {
      console.error('Failed to fetch about list:', error);
      throw error;
    }
  },

  /**
   * 根據 ID 獲取詳情
   * GET /api/About/{id}
   */
  async getById(id: number): Promise<AboutResponse> {
    try {
      const response = await apiClient.get(`/api/About/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch about details:', error);
      throw error;
    }
  },

  /**
   * 根據類型獲取列表
   * GET /api/About/type/{type}
   */
  async getByType(type: number): Promise<AboutResponse[]> {
    try {
      const response = await apiClient.get(`/api/About/type/${type}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch about by type:', error);
      throw error;
    }
  },

  /**
   * 創建關於我們
   * POST /api/About
   */
  async create(request: CreateAboutRequest): Promise<AboutResponse> {
    try {
      const response = await apiClient.post('/api/About', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create about:', error);
      throw error;
    }
  },

  /**
   * 更新關於我們
   * PUT /api/About/{id}
   */
  async update(id: number, request: UpdateAboutRequest): Promise<AboutResponse> {
    try {
      const response = await apiClient.put(`/api/About/${id}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update about:', error);
      throw error;
    }
  },

  /**
   * 刪除關於我們
   * DELETE /api/About/{id}
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/About/${id}`);
    } catch (error) {
      console.error('Failed to delete about:', error);
      throw error;
    }
  },

  /**
   * 獲取橫幅列表
   * GET /api/About/banners
   */
  async getBanners(): Promise<Banner[]> {
    try {
      const response = await apiClient.get('/api/About/banners');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      throw error;
    }
  },

  /**
   * 獲取相關連結列表
   * GET /api/About/links
   */
  async getLinks(): Promise<Link[]> {
    try {
      const response = await apiClient.get('/api/About/links');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch links:', error);
      throw error;
    }
  },

  /**
   * 獲取網頁列表
   * GET /api/About/pages
   */
  async getPages(): Promise<Page[]> {
    try {
      const response = await apiClient.get('/api/About/pages');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      throw error;
    }
  },

  /**
   * 獲取郵件模板列表
   * GET /api/About/email-templates
   */
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const response = await apiClient.get('/api/About/email-templates');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch email templates:', error);
      throw error;
    }
  },

  /**
   * 獲取相簿列表
   * GET /api/About/albums
   */
  async getAlbums(): Promise<Album[]> {
    try {
      const response = await apiClient.get('/api/About/albums');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch albums:', error);
      throw error;
    }
  },
};
