
import { apiClient } from '@/lib/api-client';
import type {
  ProductResponse,
  CreateProductRequest,
  UpdateProductRequest,
} from '@/types/product';
import type { PagedResponse } from '@/types/api';

export const productApi = {
  /**
   * 獲取產品分頁列表
   * GET /api/Product
   */
  async getPaged(pageIndex = 1, pageSize = 20): Promise<ProductResponse[]> {
    try {
      const response = await apiClient.get<PagedResponse<ProductResponse>>('/api/Product', {
        params: { pageIndex, pageSize },
      });
      return response.data.items ?? [];
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  },

  /**
   * 獲取產品詳情
   * GET /api/Product/{id}
   */
  async getById(id: number): Promise<ProductResponse> {
    try {
      const response = await apiClient.get(`/api/Product/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch product details:', error);
      throw error;
    }
  },

  /**
   * 創建新產品
   * POST /api/Product
   */
  async create(request: CreateProductRequest): Promise<ProductResponse> {
    try {
      const response = await apiClient.post('/api/Product', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  },

  /**
   * 更新產品
   * PUT /api/Product/{id}
   */
  async update(id: number, request: UpdateProductRequest): Promise<ProductResponse> {
    try {
      const response = await apiClient.put(`/api/Product/${id}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  },

  /**
   * 刪除產品
   * DELETE /api/Product/{id}
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/Product/${id}`);
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  },
};
