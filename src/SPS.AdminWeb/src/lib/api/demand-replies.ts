import { apiClient } from '@/lib/api-client';
import type { DemandReply, DemandReplyCounts, DemandReplyStatus } from '@/types/demand-reply';
import type { PagedResponse } from '@/types/api';

// ========== 需求回應審核 API（供應業者對媒合需求的回應，通過後才寄給刊登者與追蹤者）==========
export const demandRepliesApi = {
  async getReplies(page = 1, pageSize = 20, status?: DemandReplyStatus): Promise<PagedResponse<DemandReply>> {
    const response = await apiClient.get('/api/admin/demand-replies', { params: { Page: page, PageSize: pageSize, Status: status } });
    return response.data;
  },

  async getCounts(): Promise<DemandReplyCounts> {
    const response = await apiClient.get('/api/admin/demand-replies/counts');
    return response.data;
  },

  async approve(id: number): Promise<DemandReply> {
    const response = await apiClient.post(`/api/admin/demand-replies/${id}/approve`);
    return response.data;
  },

  async reject(id: number, reason: string): Promise<DemandReply> {
    const response = await apiClient.post(`/api/admin/demand-replies/${id}/reject`, { reason });
    return response.data;
  },
};
