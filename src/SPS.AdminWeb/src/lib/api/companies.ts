import { apiClient } from '@/lib/api-client';
import type {
  Company,
  CompanySearchParams,
  CompanyStatistics,
  CompanyTagOption,
  CompanyTagsResponse,
  CreateCompanyRequest,
  UpdateCompanyRequest
} from '@/types/company';
import { Status } from '@/types/company';
import type { PagedResponse } from '@/types/api';
import { categoriesApi } from '@/lib/api/category';

/** 企業標籤分類類型（對應後端 CategoryType.CompanyTag = 6） */
const COMPANY_TAG_CATEGORY_TYPE = 6;


export const companiesApi = {
  // 獲取公司列表
  async getCompanies(
    pageIndex = 1,
    pageSize = 20,
    params?: CompanySearchParams
  ): Promise<PagedResponse<Company>> {
    const response = await apiClient.get('/api/Company', {
      params: {
        Page: pageIndex,
        PageSize: pageSize,
        Search: params?.search,
        Type: params?.type,
        Level: params?.level,
        Status: params?.status,
        IsVerified: params?.isVerified,
      },
    });
    return response.data;
  },

  // 獲取公司詳情
  async getCompanyById(id: string): Promise<Company> {
    const response = await apiClient.get(`/api/Company/${id}`);
    return response.data;
  },

  // 根據統一編號獲取企業
  async getCompanyByCode(code: string): Promise<Company> {
    const response = await apiClient.get(`/api/Company/by-code/${code}`);
    return response.data;
  },

  // 創建企業
  async createCompany(data: CreateCompanyRequest): Promise<Company> {
    const response = await apiClient.post('/api/Company', data);
    return response.data;
  },

  // 更新企業
  async updateCompany(id: string, data: UpdateCompanyRequest): Promise<Company> {
    const response = await apiClient.put(`/api/Company/${id}`, data);
    return response.data;
  },

  // 刪除企業
  async deleteCompany(id: string): Promise<void> {
    await apiClient.delete(`/api/Company/${id}`);
  },

  // 更新公司狀態
  async updateCompanyStatus(id: string, status: Status): Promise<Company> {
    return this.updateCompany(id, { status });
  },

  // 刪除公司所有資料（包含圖片、產品、成員等）
  async deleteAllCompanyData(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/api/admin/company/${id}/all-data`);
    return response.data;
  },

  // 批次更新公司狀態
  async batchUpdateStatus(companyIds: string[], status: number): Promise<{ success: number; failed: number }> {
    const response = await apiClient.put('/api/Company/batch/status', {
      companyIds,
      status,
    });
    return response.data;
  },

  // 批次刪除公司（僅限系統管理員）
  async batchDelete(companyIds: string[]): Promise<{ success: number; failed: number }> {
    const response = await apiClient.delete('/api/admin/company/batch', {
      data: { companyIds },
    });
    return response.data;
  },

  // 匯出公司列表為 Excel
  async exportToExcel(ids: string[], params?: CompanySearchParams): Promise<void> {
    const response = await apiClient.post(
      '/api/export/companies',
      {
        ids: ids.length > 0 ? ids : undefined,
        search: params?.search,
        type: params?.type,
        level: params?.level,
        status: params?.status,
        isVerified: params?.isVerified,
      },
      { responseType: 'blob' }
    );
    const blob = new Blob([response.data as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const date = new Date().toLocaleDateString('zh-TW').replace(/\//g, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `公司列表_${date}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  },

  // 取得可供選擇的企業標籤清單（CategoryType.CompanyTag 分類節點，含階層 parentId）
  async getCompanyTagOptions(): Promise<CompanyTagOption[]> {
    const categories = await categoriesApi.getCategoriesByType(COMPANY_TAG_CATEGORY_TYPE);
    return categories
      .filter((c) => c.published)
      .map((c) => ({
        id: c.id,
        name: c.name ?? '',
        parentId: c.parentId,
        ordinal: c.ordinal,
      }));
  },

  // 取得某企業目前綁定的企業標籤
  async getCompanyTags(id: string): Promise<CompanyTagsResponse> {
    const response = await apiClient.get(`/api/Company/${id}/tags`);
    return response.data;
  },

  // 設定某企業的企業標籤（覆寫綁定，支援多個標籤）
  async setCompanyTags(id: string, tagIds: number[]): Promise<CompanyTagsResponse> {
    const response = await apiClient.put(`/api/Company/${id}/tags`, { tagIds });
    return response.data;
  },

  // 獲取統計數據
  async getStatistics(): Promise<CompanyStatistics> {
    // ✅ Backend implemented: 2026-01-14
    // 📖 Endpoint: GET /api/Company/statistics
    try {
      const response = await apiClient.get('/api/Company/statistics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch company statistics:', error);
      throw error;
    }
  },
};

