import { apiClient } from '@/lib/api-client';
import type {
  QuestionResponse,
  CreateQuestionRequest,
  UpdateQuestionRequest,
} from '@/types/question';
import type { PagedResponse } from '@/types/api';

export const questionsApi = {
  /**
   * 獲取常見問題分頁列表
   * GET /api/Question
   */
  async getPaged(pageIndex = 1, pageSize = 20): Promise<QuestionResponse[]> {
    try {
      const response = await apiClient.get<PagedResponse<QuestionResponse>>('/api/Question', {
        params: { pageIndex, pageSize },
      });
      return response.data.items ?? [];
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      throw error;
    }
  },

  /**
   * 獲取問題詳情
   * GET /api/Question/{id}
   */
  async getById(id: number): Promise<QuestionResponse> {
    try {
      const response = await apiClient.get(`/api/Question/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch question details:', error);
      throw error;
    }
  },

  /**
   * 根據分類獲取問題列表
   * GET /api/Question/category/{categoryId}
   */
  async getByCategory(categoryId: number): Promise<QuestionResponse[]> {
    try {
      const response = await apiClient.get(`/api/Question/category/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch questions by category:', error);
      throw error;
    }
  },

  /**
   * 創建常見問題
   * POST /api/Question
   */
  async create(request: CreateQuestionRequest): Promise<QuestionResponse> {
    try {
      const response = await apiClient.post('/api/Question', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create question:', error);
      throw error;
    }
  },

  /**
   * 更新常見問題
   * PUT /api/Question/{id}
   */
  async update(id: number, request: UpdateQuestionRequest): Promise<QuestionResponse> {
    try {
      const response = await apiClient.put(`/api/Question/${id}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update question:', error);
      throw error;
    }
  },

  /**
   * 刪除常見問題
   * DELETE /api/Question/{id}
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/Question/${id}`);
    } catch (error) {
      console.error('Failed to delete question:', error);
      throw error;
    }
  },
};
