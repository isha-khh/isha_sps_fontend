import { apiClient } from '@/lib/api-client';
import type { Inquiry, InquiryCounts, InquirySearchParams, InquiryStatus } from '@/types/inquiry';
import type { PagedResponse } from '@/types/api';

// ========== 詢問單 API（前台各個「留下資料等人回覆」的表單送到這裡）==========
export const inquiriesApi = {
  async getInquiries(page = 1, pageSize = 20, params?: InquirySearchParams): Promise<PagedResponse<Inquiry>> {
    const response = await apiClient.get('/api/Inquiry', {
      params: { Page: page, PageSize: pageSize, Type: params?.type, Status: params?.status, Search: params?.search },
    });
    return response.data;
  },

  async getCounts(): Promise<InquiryCounts> {
    const response = await apiClient.get('/api/Inquiry/counts');
    return response.data;
  },

  async update(id: string, data: { status: InquiryStatus; handlerNote?: string }): Promise<Inquiry> {
    const response = await apiClient.put(`/api/Inquiry/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/api/Inquiry/${id}`);
  },
};
