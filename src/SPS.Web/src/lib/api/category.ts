// ========== 分類 API (CategoryController) ==========
import { apiClient } from '@/lib/api-client';
import type { PagedResponse } from '@/types/api';
import type {
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryTreeNode,
  CategoryQueryParams,
} from '@/types/category';



export const categoriesApi = {
  async getCategories(params?: CategoryQueryParams): Promise<PagedResponse<CategoryResponse>> {
    const response = await apiClient.get<PagedResponse<CategoryResponse>>('/api/Category', { params });
    return response.data;
  },

  async getCategoriesByType(type: number): Promise<CategoryResponse[]> {
    const response = await apiClient.get<CategoryResponse[]>(`/api/Category/type/${type}`);
    return response.data;
  },

  async getCategoryTree(type?: number): Promise<CategoryTreeNode[]> {
    const response = await apiClient.get<CategoryTreeNode[]>('/api/Category/tree', { params: { type } });
    return response.data;
  },

  async getCategoryById(id: number): Promise<CategoryResponse> {
    const response = await apiClient.get<CategoryResponse>(`/api/Category/${id}`);
    return response.data;
  },

  async createCategory(request: CreateCategoryRequest): Promise<CategoryResponse> {
    const response = await apiClient.post<CategoryResponse>('/api/Category', request);
    return response.data;
  },

  async updateCategory(id: number, request: UpdateCategoryRequest): Promise<CategoryResponse> {
    const response = await apiClient.put<CategoryResponse>(`/api/Category/${id}`, request);
    return response.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`/api/Category/${id}`);
  },
};
