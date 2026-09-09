import { apiClient } from '@/lib/api-client';
import type {
  Company,
  CompanySearchParams,
  CompanyStatistics,
  CreateCompanyRequest,
  UpdateCompanyRequest
} from '@/types/company';
import { Status } from '@/types/company';
import type { PagedResponse } from '@/types/api';


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
        SortBy: params?.sortBy,
        Descending: params?.descending,
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

