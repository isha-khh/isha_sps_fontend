import { apiClient } from '@/lib/api-client';
import type { AddExpertScoreRequest, ScoringSummary } from '@/types/scoring';

/**
 * 新興會員委員評分（外部專家沒有後台帳號，由內部審核人員代為輸入，
 * 一位專家一筆）。對應後端 AdminApplicationsController 的
 * `/api/admin/applications/{id}/scores`。
 */
export const scoringApi = {
  async getSummary(applicationId: string): Promise<ScoringSummary> {
    const response = await apiClient.get<ScoringSummary>(`/api/admin/applications/${applicationId}/scores`);
    return response.data;
  },

  async addExpertScore(applicationId: string, request: AddExpertScoreRequest): Promise<void> {
    await apiClient.post(`/api/admin/applications/${applicationId}/scores`, request);
  },

  async deleteExpertScore(applicationId: string, scoringId: number): Promise<void> {
    await apiClient.delete(`/api/admin/applications/${applicationId}/scores/${scoringId}`);
  },
};
