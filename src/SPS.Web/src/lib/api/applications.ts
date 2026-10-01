import { isAxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type {
  ApplicationResponse,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  SubmitApplicationRequest,
  DocumentResponse,
  DocumentType,
  ValidationResult,
} from '@/types/application';

export const applicationsApi = {
  /**
   * 創建申請（草稿）
   * POST /api/Applications
   */
  async create(request: CreateApplicationRequest): Promise<ApplicationResponse> {
    try {
      const response = await apiClient.post<ApplicationResponse>('/api/Applications', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create application:', error);
      throw error;
    }
  },

  /**
   * 獲取申請詳情
   * GET /api/Applications/{id}
   */
  async getById(id: string): Promise<ApplicationResponse> {
    try {
      const response = await apiClient.get<ApplicationResponse>(`/api/Applications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch application:', error);
      throw error;
    }
  },

  /**
   * 更新申請（僅草稿狀態）
   * PUT /api/Applications/{id}
   */
  async update(id: string, request: UpdateApplicationRequest): Promise<ApplicationResponse> {
    try {
      const response = await apiClient.put<ApplicationResponse>(`/api/Applications/${id}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to update application:', error);
      throw error;
    }
  },

  /**
   * 獲取我的申請列表
   * GET /api/Applications/my?email={email}
   */
  async getMyApplications(email: string): Promise<ApplicationResponse[]> {
    try {
      const response = await apiClient.get<ApplicationResponse[]>('/api/Applications/my', {
        params: { email },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch my applications:', error);
      throw error;
    }
  },

  /**
   * 提交申請（從草稿變為待審核）
   * POST /api/Applications/{id}/submit
   */
  async submit(id: string, request: SubmitApplicationRequest): Promise<ApplicationResponse> {
    try {
      const response = await apiClient.post<ApplicationResponse>(`/api/Applications/${id}/submit`, request ?? {});
      return response.data;
    } catch (error) {
      console.error('Failed to submit application:', error);
      throw error;
    }
  },

  /**
   * 取消申請
   * POST /api/Applications/{id}/cancel
   */
  async cancel(id: string, request?: SubmitApplicationRequest): Promise<ApplicationResponse> {
    try {
      const response = await apiClient.post<ApplicationResponse>(`/api/Applications/${id}/cancel`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to cancel application:', error);
      throw error;
    }
  },

  /**
   * 上傳申請文件
   * POST /api/Applications/{id}/documents
   */
  async uploadDocument(payload: { applicationId: string; type: DocumentType; file: File }): Promise<DocumentResponse> {
    try {
      const fd = new FormData();
      fd.append('ApplicationId', payload.applicationId);
      fd.append('Type', String(payload.type));
      fd.append('File', payload.file, payload.file.name);

      const response = await apiClient.post<DocumentResponse>(
        `/api/Applications/${payload.applicationId}/documents`,
        fd,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to upload document:', error);
      throw error;
    }
  },

  /**
   * 刪除申請文件
   * DELETE /api/Applications/documents/{documentId}
   */
  async deleteDocument(documentId: string) {
    try {
      await apiClient.delete(`/api/Applications/documents/${documentId}`);
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  },

  /**
   * 驗證申請是否可提交
   * GET /api/Applications/{id}/validate
   *
   * 後端驗證失敗時是用 HTTP 400 回傳 `{valid:false, error}`（不是
   * 200 包一個 valid:false），axios 預設會把 400 當成 rejected
   * promise——這裡接住 400 把它當成正常的驗證結果回傳，只有真的
   * 意外錯誤（網路斷線、其他狀態碼）才繼續往外丟。
   */
  async validate(id: string): Promise<ValidationResult> {
    try {
      const response = await apiClient.get<ValidationResult>(`/api/Applications/${id}/validate`);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 400 && error.response.data) {
        return error.response.data as ValidationResult;
      }
      console.error('Failed to validate application:', error);
      throw error;
    }
  },

  /**
   * 查詢公司資料
   * GET /api/Applications/company-info
   */
  async getCompanyInfo(unifiedSocialCreditCode: string) {
    try {
      const response = await apiClient.get('/api/Applications/company-info', {
        params: { unifiedSocialCreditCode: unifiedSocialCreditCode.trim() },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch company info:', error);
      throw error;
    }
  },
};
