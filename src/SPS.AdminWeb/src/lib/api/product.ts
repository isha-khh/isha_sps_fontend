
import { apiClient } from '@/lib/api-client';
import type {
  ProductResponse,
  CreateProductRequest,
  UpdateProductRequest,
  ProductQueryParameters,
} from '@/types/product';
import type { PagedResponse } from '@/types/api';

export const productApi = {
  /**
   * 獲取產品分頁列表
   * GET /api/Product
   */
  async getPaged(
    pageIndex = 1,
    pageSize = 20,
    params?: ProductQueryParameters
  ): Promise<PagedResponse<ProductResponse>> {
    try {
      const response = await apiClient.get<PagedResponse<ProductResponse>>('/api/Product', {
        params: {
          pageIndex,
          pageSize,
          search: params?.search,
          companyId: params?.companyId,
          categoryId: params?.categoryId,
          published: params?.published,
          sortBy: params?.sortBy,
          descending: params?.descending,
        },
      });
      return response.data;
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
   * 匯出產品列表為 Excel
   * POST /api/export/products
   */
  async exportToExcel(ids: number[], params?: ProductQueryParameters): Promise<void> {
    const response = await apiClient.post(
      '/api/export/products',
      {
        ids: ids.length > 0 ? ids : undefined,
        search: params?.search,
        published: params?.published,
        companyId: params?.companyId,
      },
      { responseType: 'blob' }
    );
    const blob = new Blob([response.data as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const date = new Date().toLocaleDateString('zh-TW').replace(/\//g, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `產品列表_${date}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
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
