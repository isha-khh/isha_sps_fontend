import { apiClient } from '@/lib/api-client';
import type { ProTrackSubmissionItem, ProTrackImportResult, SimilarCompanyResult, SimilarCompanyByVectorResult } from '@/types/protrack';

export const protrackApi = {
  async getSubmissions(): Promise<ProTrackSubmissionItem[]> {
    const response = await apiClient.get('/api/ProTrack/submissions');
    return response.data;
  },

  async parseSubmission(id: string): Promise<ProTrackImportResult> {
    const response = await apiClient.get(`/api/ProTrack/submissions/${id}`);
    return response.data;
  },
};

export const similarCompaniesApi = {
  async getSimilarCompanies(tagIds: number[]): Promise<SimilarCompanyResult[]> {
    if (tagIds.length === 0) return [];
    const params = new URLSearchParams();
    tagIds.forEach((id) => params.append('tagIds', String(id)));
    const response = await apiClient.get(`/api/Demand/similar-companies?${params.toString()}`);
    return response.data;
  },

  /** AI 語意搜尋：依需求內容找相似業者。需求必須已儲存（有 demandId）才能呼叫。 */
  async getSimilarCompaniesByVector(demandId: string): Promise<SimilarCompanyByVectorResult[]> {
    const response = await apiClient.get(`/api/Demand/${demandId}/similar-companies-ai`);
    return response.data;
  },

  /** AI 語意搜尋即時預覽：新增需求頁尚未儲存前，用當下輸入內容做一次性查詢，不寫入索引。 */
  async previewSimilarCompaniesByVector(params: {
    name?: string;
    introduction?: string;
    tagIds?: number[];
  }): Promise<SimilarCompanyByVectorResult[]> {
    const response = await apiClient.post('/api/Demand/similar-companies-ai/preview', params);
    return response.data;
  },
};
