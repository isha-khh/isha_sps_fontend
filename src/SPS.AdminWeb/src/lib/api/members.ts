import { apiClient } from '@/lib/api-client';
import type {
  Member,
  MemberSearchParams,
  MemberStatistics,
  MemberStatus,
  MemberPosition,
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
        HasCompany: params?.hasCompany,
        IsEmailVerified: params?.isEmailVerified,
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

  // 更新會員角色（經理/員工）
  async updateMemberPosition(id: string, memberPosition: MemberPosition): Promise<Member> {
    return this.updateMember(id, { memberPosition });
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

  // 切換指定聯絡人狀態
  async toggleDesignatedContact(id: string, isDesignatedContact: boolean): Promise<Member> {
    const response = await apiClient.put(`/api/admin/members/${id}/designated-contact`, { isDesignatedContact });
    return response.data;
  },

  // 批次重置密碼
  async batchResetPassword(
    memberIds: string[],
    options?: { requireChangeOnLogin?: boolean; sendNotificationEmail?: boolean }
  ): Promise<{ success: number; failed: number }> {
    const response = await apiClient.post('/api/admin/members/batch/reset-password', {
      memberIds,
      requireChangeOnLogin: options?.requireChangeOnLogin ?? true,
      sendNotificationEmail: options?.sendNotificationEmail ?? true,
    });
    return response.data;
  },

  // 批次設定要求下次登入修改密碼
  async batchRequirePasswordChange(
    memberIds: string[],
    requireChange: boolean
  ): Promise<{ success: number; failed: number }> {
    const response = await apiClient.put('/api/admin/members/batch/require-password-change', {
      memberIds,
      requireChange,
    });
    return response.data;
  },

  // 批次更新信箱驗證狀態
  async batchUpdateEmailVerification(
    memberIds: string[],
    isVerified: boolean
  ): Promise<{ success: number; failed: number }> {
    const response = await apiClient.put('/api/admin/members/batch/email-verification', {
      memberIds,
      isVerified,
    });
    return response.data;
  },

  // 匯出會員列表為 Excel
  async exportToExcel(ids: string[], params?: MemberSearchParams): Promise<void> {
    const response = await apiClient.post(
      '/api/export/members',
      {
        ids: ids.length > 0 ? ids : undefined,
        search: params?.search,
        status: params?.status,
        role: params?.role,
        companyId: params?.companyId,
        isApproved: params?.isApproved,
        hasCompany: params?.hasCompany,
        isEmailVerified: params?.isEmailVerified,
      },
      { responseType: 'blob' }
    );
    const blob = new Blob([response.data as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const date = new Date().toLocaleDateString('zh-TW').replace(/\//g, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `會員列表_${date}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  },
};


