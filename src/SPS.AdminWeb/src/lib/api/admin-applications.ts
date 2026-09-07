import { apiClient } from '@/lib/api-client';
import type {
  Application,
  ApplicationStatistics,
  PagedResponse,
  Document,
} from '@/types/api';
import type {
  CreateApplicationRequest,
  UpdateApplicationRequest
} from "@/types/application.ts";
import type {
  CancelApplicationRequest,
  ReviewApplicationRequest, SubmitAdminApplicationRequest,
  UploadDocumentRequest,
  ValidationResponse
} from "@/types/admin-applications.ts";

// ==================== 請求/響應 DTO ====================

// ==================== API 客戶端 ====================

export const adminApplicationsApi = {
  // ========== 公開 API（前台用戶，無需登入）==========

  /**
   * 創建申請（草稿）- 支持多成員
   * POST /api/Applications
   */
  async createApplication(request: CreateApplicationRequest): Promise<Application> {
    try {
      const response = await apiClient.post('/api/Applications', request);
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
  async getApplicationById(id: string): Promise<Application> {
    try {
      const response = await apiClient.get(`/api/Applications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch application details:', error);
      throw error;
    }
  },

  /**
   * 更新申請（僅草稿狀態）
   * PUT /api/Applications/{id}
   */
  async updateApplication(id: string, request: UpdateApplicationRequest): Promise<Application> {
    try {
      const response = await apiClient.put(`/api/Applications/${id}`, request);
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
  async getMyApplications(email: string): Promise<Application[]> {
    try {
      const response = await apiClient.get('/api/Applications/my', {
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
  async submitApplication(request: SubmitAdminApplicationRequest): Promise<Application> {
    try {
      const response = await apiClient.post(
        `/api/Applications/${request.applicationId}/submit`,
        request
      );
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
  async cancelApplication(id: string, request?: CancelApplicationRequest): Promise<void> {
    try {
      await apiClient.post(`/api/Applications/${id}/cancel`, request);
    } catch (error) {
      console.error('Failed to cancel application:', error);
      throw error;
    }
  },

  /**
   * 上傳申請文件
   * POST /api/Applications/{id}/documents
   */
  async uploadDocument(request: UploadDocumentRequest): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('ApplicationId', request.applicationId);
      formData.append('Type', request.type.toString());
      formData.append('File', request.file);

      const response = await apiClient.post(
        `/api/Applications/${request.applicationId}/documents`,
        formData,
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
  async deleteDocument(documentId: string): Promise<void> {
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
   */
  async validateApplication(id: string): Promise<ValidationResponse> {
    try {
      const response = await apiClient.get(`/api/Applications/${id}/validate`);
      return response.data;
    } catch (error) {
      console.error('Failed to validate application:', error);
      throw error;
    }
  },

  // ========== 管理端 API（後台管理員，需要登入和權限）==========

  /**
   * 獲取待審核申請列表
   * GET /api/admin/applications/pending
   */
  async getPendingApplications(
    pageIndex = 1,
    pageSize = 20
  ): Promise<PagedResponse<Application>> {
    try {
      const response = await apiClient.get('/api/admin/applications/pending', {
        params: { pageIndex, pageSize },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch pending applications:', error);
      throw error;
    }
  },

  /**
   * 獲取審核中申請列表
   * GET /api/admin/applications/under-review
   */
  async getUnderReviewApplications(
    pageIndex = 1,
    pageSize = 20,
    reviewerId?: string
  ): Promise<PagedResponse<Application>> {
    try {
      const response = await apiClient.get('/api/admin/applications/under-review', {
        params: { pageIndex, pageSize, reviewerId },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch under review applications:', error);
      throw error;
    }
  },

  /**
   * 獲取已完成申請列表
   * GET /api/admin/applications/completed
   */
  async getCompletedApplications(
    pageIndex = 1,
    pageSize = 20,
    status?: string
  ): Promise<PagedResponse<Application>> {
    try {
      const response = await apiClient.get('/api/admin/applications/completed', {
        params: { pageIndex, pageSize, status },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch completed applications:', error);
      throw error;
    }
  },

  /**
   * 領取申請
   * POST /api/admin/applications/{id}/claim
   */
  async claimApplication(id: string): Promise<Application> {
    try {
      const response = await apiClient.post(`/api/admin/applications/${id}/claim`);
      return response.data;
    } catch (error) {
      console.error('Failed to claim application:', error);
      throw error;
    }
  },

  /**
   * 審核申請（通過或拒絕）
   * POST /api/admin/applications/{id}/review
   */
  async reviewApplication(id: string, request: ReviewApplicationRequest): Promise<Application> {
    try {
      const response = await apiClient.post(`/api/admin/applications/${id}/review`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to review application:', error);
      throw error;
    }
  },

  /**
   * 獲取申請統計數據
   * GET /api/admin/applications/statistics
   */
  async getStatistics(): Promise<ApplicationStatistics> {
    try {
      const response = await apiClient.get('/api/admin/applications/statistics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch application statistics:', error);
      throw error;
    }
  },

  /**
   * 下載單個附件
   * GET /api/admin/applications/documents/{documentId}/download
   */
  async downloadDocument(documentId: string): Promise<void> {
    try {
      const response = await apiClient.get(
        `/api/admin/applications/documents/${documentId}/download`,
        { responseType: 'blob' }
      );
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'download';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;\n]*)/i);
        if (match) fileName = decodeURIComponent(match[1].replace(/"/g, ''));
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download document:', error);
      throw error;
    }
  },

  /**
   * 打包下載所有附件
   * GET /api/admin/applications/{id}/documents/download-all
   */
  async downloadAllDocuments(applicationId: string): Promise<void> {
    try {
      const response = await apiClient.get(
        `/api/admin/applications/${applicationId}/documents/download-all`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `application-${applicationId}-documents.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download all documents:', error);
      throw error;
    }
  },

  /**
   * 管理員上傳附件（UnderReview 狀態）
   * POST /api/admin/applications/{id}/documents/upload
   */
  async uploadDocumentByAdmin(request: UploadDocumentRequest): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('ApplicationId', request.applicationId);
      formData.append('Type', request.type.toString());
      formData.append('File', request.file);

      const response = await apiClient.post(
        `/api/admin/applications/${request.applicationId}/documents/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to upload document by admin:', error);
      throw error;
    }
  },

  /**
   * 管理員刪除附件（UnderReview 狀態）
   * DELETE /api/admin/applications/documents/{documentId}
   */
  async deleteDocumentByAdmin(documentId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/admin/applications/documents/${documentId}`);
    } catch (error) {
      console.error('Failed to delete document by admin:', error);
      throw error;
    }
  },
};
