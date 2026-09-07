import { apiClient } from '@/lib/api-client';
import type {
  AdminUserInfo,
  AdminRegisterRequest,
  AdminLoginRequest,
  SystemInitResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ValidateResetTokenResponse,
  UpdateAvatarRequest,
  UpdateProfileRequest
} from '@/types/admin-auth';
import type { PasswordPolicySettings } from '@/types/settings';
import type {
  Fido2CredentialInfo,
  Fido2RegisterCompleteRequest,
  Fido2AuthenticateStartRequest,
  Fido2AuthenticateCompleteRequest,
} from '@/types/fido2';

export interface TestResponse {
  message: string;
  user: string;
  claims: { type: string; value: string }[];
}

export const adminAuthApi = {
  /**
   * 檢查系統是否需要初始化
   */
  async checkInit(): Promise<SystemInitResponse> {
    const response = await apiClient.get<SystemInitResponse>('/api/admin/AdminAuth/check-init');
    return response.data;
  },

  /**
   * 註冊首個系統管理員
   */
  async registerFirstAdmin(data: AdminRegisterRequest): Promise<AdminUserInfo> {
    const response = await apiClient.post<AdminUserInfo>('/api/admin/AdminAuth/register-first-admin', data);
    return response.data;
  },

  /**
   * 後台管理員登入
   */
  async login(request: AdminLoginRequest): Promise<AdminUserInfo> {
    const response = await apiClient.post<AdminUserInfo>('/api/admin/AdminAuth/login', request);
    return response.data;
  },

  /**
   * 登出
   */
  async logout(): Promise<void> {
    await apiClient.post('/api/admin/AdminAuth/logout');
  },

  /**
   * 獲取當前管理員信息
   */
  async getProfile(): Promise<AdminUserInfo> {
    const response = await apiClient.get<AdminUserInfo>('/api/admin/AdminAuth/profile');
    return response.data;
  },

  /**
   * 刷新令牌
   */
  async refreshToken(): Promise<AdminUserInfo> {
    const response = await apiClient.post<AdminUserInfo>('/api/admin/AdminAuth/refresh');
    return response.data;
  },

  /**
   * 測試認證端點
   */
  async test(): Promise<TestResponse> {
    const response = await apiClient.get<TestResponse>('/api/admin/AdminAuth/test');
    return response.data;
  },

  /**
   * 修改密碼
   */
  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/api/admin/AdminAuth/change-password', request);
  },

  /**
   * 忘記密碼 - 發送重置密碼郵件
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await apiClient.post('/api/admin/AdminAuth/forgot-password', request);
  },

  /**
   * 重置密碼 - 透過 Token 設定新密碼
   */
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    await apiClient.post('/api/admin/AdminAuth/reset-password', request);
  },

  /**
   * 驗證重置密碼 Token 是否有效
   */
  async validateResetToken(token: string): Promise<ValidateResetTokenResponse> {
    const response = await apiClient.get<ValidateResetTokenResponse>(
      '/api/admin/AdminAuth/validate-reset-token',
      { params: { token } }
    );
    return response.data;
  },

  /**
   * 更新頭像
   */
  async updateAvatar(request: UpdateAvatarRequest): Promise<AdminUserInfo> {
    const response = await apiClient.put<AdminUserInfo>('/api/admin/AdminAuth/avatar', request);
    return response.data;
  },

  /**
   * 更新個人資料
   */
  async updateProfile(request: UpdateProfileRequest): Promise<AdminUserInfo> {
    const response = await apiClient.put<AdminUserInfo>('/api/admin/AdminAuth/profile', request);
    return response.data;
  },

  /** 取得密碼策略（公開） */
  async getPasswordPolicy(): Promise<PasswordPolicySettings> {
    const response = await apiClient.get<PasswordPolicySettings>('/api/admin/AdminAuth/password-policy');
    return response.data;
  },

  // ===== FIDO2 WebAuthn =====

  /** 取得 FIDO2 啟用狀態（公開） */
  async fido2Status(): Promise<{ enabled: boolean }> {
    const response = await apiClient.get<{ enabled: boolean }>('/api/admin/AdminAuth/fido2/status');
    return response.data;
  },

  /** FIDO2 開始註冊 */
  async fido2RegisterStart(deviceName?: string): Promise<unknown> {
    const response = await apiClient.post('/api/admin/AdminAuth/fido2/register/start', { deviceName });
    return response.data;
  },

  /** FIDO2 完成註冊 */
  async fido2RegisterComplete(request: Fido2RegisterCompleteRequest): Promise<void> {
    await apiClient.post('/api/admin/AdminAuth/fido2/register/complete', request);
  },

  /** FIDO2 開始認證 */
  async fido2AuthenticateStart(request?: Fido2AuthenticateStartRequest): Promise<unknown> {
    const response = await apiClient.post('/api/admin/AdminAuth/fido2/authenticate/start', request ?? {});
    return response.data;
  },

  /** FIDO2 完成認證 */
  async fido2AuthenticateComplete(request: Fido2AuthenticateCompleteRequest): Promise<AdminUserInfo> {
    const response = await apiClient.post<AdminUserInfo>('/api/admin/AdminAuth/fido2/authenticate/complete', request);
    return response.data;
  },

  /** 取得 FIDO2 憑證列表 */
  async fido2GetCredentials(): Promise<Fido2CredentialInfo[]> {
    const response = await apiClient.get<Fido2CredentialInfo[]>('/api/admin/AdminAuth/fido2/credentials');
    return response.data;
  },

  /** 刪除 FIDO2 憑證 */
  async fido2DeleteCredential(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/AdminAuth/fido2/credentials/${id}`);
  },
};
