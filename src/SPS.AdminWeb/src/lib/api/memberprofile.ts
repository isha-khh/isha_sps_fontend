

// ========== 會員  API (Legacy Compat) ==========
import type {
    CompanyResponse,
    MemberChangePasswordRequest,
    MemberListItemResponse,
    MemberProfileResponse,
    ResetMemberPasswordRequest,
    UpdateMemberProfileRequest,
    VerificationCodePurpose
} from "@/types/memberprofile.ts";
import {apiClient} from "@/lib/api-client.ts";
import type {UpdateCompanyRequest} from "@/types/company.ts";


// MemberProfile
// 前台會員資料控制器
export const memberprofileApi = {
  // 取得個人資料
  async getMembersProfile(): Promise<MemberProfileResponse> {
    const response = await apiClient.get('/api/member/profile', {
    });
    return response.data;
  },

  // 更新個人資料
  async updateMembersProfile(
      request: UpdateMemberProfileRequest
  ): Promise<MemberProfileResponse> {
    const response = await apiClient.put('/api/member/profile', request);
    return response.data;
  },

  // 發送驗證碼
  async sendVerificationCode(purpose: VerificationCodePurpose): Promise<void> {
    await apiClient.post('/api/member/send-verification-code', { purpose });
  },

  // 修改密碼
  async changePassword(request: MemberChangePasswordRequest): Promise<void> {
    await apiClient.post('/api/member/change-password', request);
  },

  // 驗證信箱
  async verifyEmail(verificationCode: string): Promise<void> {
    await apiClient.post('/api/member/verify-email', { verificationCode });
  },

  // 取得公司資料
  async getCompanyProfile(): Promise<CompanyResponse> {
    const response = await apiClient.get(`/api/member/company`);
    return response.data;
  },

  // 更新公司資料
  async updateCompanyProfile(request: UpdateCompanyRequest): Promise<CompanyResponse> {
    const response = await apiClient.put('/api/member/company', request);
    return response.data;
  },

  // 取得公司成員列表
  async getMembersList(): Promise<MemberListItemResponse[]> {
    const response = await apiClient.get('/api/member/company/members');
    return response.data;
  },

  // Manager 重置成員密碼
  async resetPasswordById(id: string, request: ResetMemberPasswordRequest): Promise<void> {
    await apiClient.post(`/api/member/company/members/${id}/reset-password`, request);
  },
};


