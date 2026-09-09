import { apiClient } from '@/lib/api-client';
import type {
  Member,
  MemberSearchParams,
  MemberStatistics,
  MemberStatus,
  UpdateMemberRequest,
  AdminResetMemberPasswordRequest
} from '@/types/member';
import type { PagedResponse } from '@/types/api';



// ========== 會員  API (Legacy Compat) ==========
export const membersApi = {
  // 獲取會員列表
  async getMembers(
    pageIndex = 1,
    pageSize = 20,
    params?: MemberSearchParams
  ): Promise<PagedResponse<Member>> {
    const response = await apiClient.get('/api/admin/members', {
      params: {
        Page: pageIndex,
        PageSize: pageSize,
        Search: params?.search,
        Status: params?.status,
        Role: params?.role,
        CompanyId: params?.companyId,
        IsApproved: params?.isApproved,
      },
    });
    return response.data;
  },

  // 獲取特定公司的會員列表
  async getMembersByCompanyId(
    companyId: string,
    pageIndex = 1,
    pageSize = 20
  ): Promise<PagedResponse<Member>> {
    return this.getMembers(pageIndex, pageSize, { companyId });
  },

  // 獲取會員詳情
  async getMemberById(id: string): Promise<Member> {
    const response = await apiClient.get(`/api/admin/members/${id}`);
    return response.data;
  },

  // 更新會員資訊
  async updateMember(id: string, data: UpdateMemberRequest): Promise<Member> {
    const response = await apiClient.put(`/api/admin/members/${id}`, data);
    return response.data;
  },

  // 更新會員狀態
  async updateMemberStatus(id: string, status: MemberStatus): Promise<Member> {
    return this.updateMember(id, { status });
  },

  // 刪除會員
  async deleteMember(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/members/${id}`);
  },

  // 獲取會員統計
  async getStatistics(): Promise<MemberStatistics> {
    // ✅ Backend implemented: 2026-01-14
    // 📖 Endpoint: GET /api/admin/members/statistics
    try {
      const response = await apiClient.get('/api/admin/members/statistics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch member statistics:', error);
      throw error;
    }
  },

  // 管理員重置會員密碼
  async resetMemberPassword(id: string, data: AdminResetMemberPasswordRequest): Promise<Member> {
    const response = await apiClient.post(`/api/admin/members/${id}/reset-password`, data);
    return response.data;
  },

  // 解鎖會員帳戶
  async unlockMember(id: string): Promise<void> {
    await apiClient.post(`/api/admin/members/${id}/unlock`);
  },

  // 更新會員信箱驗證狀態
  async updateEmailVerification(id: string, isVerified: boolean): Promise<Member> {
    const response = await apiClient.put(`/api/admin/members/${id}/email-verification`, { isVerified });
    return response.data;
  },
};


