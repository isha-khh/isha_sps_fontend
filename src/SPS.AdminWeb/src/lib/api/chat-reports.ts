import { apiClient } from '@/lib/api-client';
import type { ChatReport, ChatReportDetail } from '@/types/chat-report';
import type { PagedResponse } from '@/types/api';

// ========== 會員對話檢舉 API（會員之間的對話平常看不到，被檢舉的才開放審閱）==========
export const chatReportsApi = {
  async getReports(page = 1, pageSize = 20, reviewed?: boolean): Promise<PagedResponse<ChatReport>> {
    const response = await apiClient.get('/api/admin/chat-reports', { params: { page, pageSize, reviewed } });
    return response.data;
  },

  async getReport(id: number): Promise<ChatReportDetail> {
    const response = await apiClient.get(`/api/admin/chat-reports/${id}`);
    return response.data;
  },

  async update(id: number, data: { reviewed: boolean; handlerNote?: string; closeChat: boolean }): Promise<ChatReportDetail> {
    const response = await apiClient.put(`/api/admin/chat-reports/${id}`, data);
    return response.data;
  },
};
