import { apiClient } from '@/lib/api-client';
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  MemberInfo,
  SendVerificationCodeRequest,
  MemberChangePasswordRequest,
  MemberForgotPasswordRequest,
  MemberResetPasswordRequest,
  MemberValidateResetTokenResponse, PasswordPolicySettings,
} from '@/types/auth';

import type {
  Fido2AuthenticateCompleteRequest,
  Fido2AuthenticateStartRequest, Fido2CredentialInfo,
  Fido2RegisterCompleteRequest
} from "@/types/fido2";

export const authApi = {
  /**
   * 會員登入
   * POST /api/Auth/login
   */
  async login(request: LoginRequest): Promise<TokenResponse> {
    try {
      const response = await apiClient.post<TokenResponse>('/api/Auth/login', request);
      return response.data;
    } catch (error) {
      console.error('Failed to login:', error);
      throw error;
    }
  },

  /**
   * 會員註冊
   * POST /api/Auth/register
   */
  async register(request: RegisterRequest): Promise<TokenResponse> {
    try {
      const response = await apiClient.post<TokenResponse>('/api/Auth/register', request);
      return response.data;
    } catch (error) {
      console.error('Failed to register:', error);
      throw error;
    }
  },

  /**
   * 獲取當前會員信息
   * GET /api/Auth/profile
   */
  async getProfile(): Promise<MemberInfo> {
    try {
      const response = await apiClient.get<MemberInfo>('/api/Auth/profile');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw error;
    }
  },

  /**
   * 刷新令牌
   * POST /api/Auth/refresh
   */
  async refreshToken(): Promise<TokenResponse> {
    try {
      const response = await apiClient.post<TokenResponse>('/api/Auth/refresh');
      return response.data;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  },

  /**
   * 登出
   * POST /api/Auth/logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/Auth/logout');
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  },

  /**
   * 發送驗證碼
   * POST /api/Auth/send-verification-code
   */
  async sendVerificationCode(request: SendVerificationCodeRequest): Promise<void> {
    try {
      await apiClient.post('/api/Auth/send-verification-code', request);
    } catch (error) {
      console.error('Failed to send verification code:', error);
      throw error;
    }
  },

  /**
   * 修改密碼（需驗證碼）
   * POST /api/Auth/change-password
   */
  async changePassword(request: MemberChangePasswordRequest): Promise<void> {
    try {
      await apiClient.post('/api/Auth/change-password', request);
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  },

  /**
   * 忘記密碼 - 發送重置密碼郵件
   * POST /api/Auth/forgot-password
   */
  async forgotPassword(request: MemberForgotPasswordRequest): Promise<void> {
    try {
      await apiClient.post('/api/Auth/forgot-password', request);
    } catch (error) {
      console.error('Failed to send forgot password email:', error);
      throw error;
    }
  },

  /**
   * 重置密碼 - 透過 Token 設定新密碼
   * POST /api/Auth/reset-password
   */
  async resetPassword(request: MemberResetPasswordRequest): Promise<void> {
    try {
      await apiClient.post('/api/Auth/reset-password', request);
    } catch (error) {
      console.error('Failed to reset password:', error);
      throw error;
    }
  },

  /**
   * 驗證重置密碼 Token 是否有效
   * GET /api/Auth/validate-reset-token
   */
  async validateResetToken(token: string): Promise<MemberValidateResetTokenResponse> {
    try {
      const response = await apiClient.get<MemberValidateResetTokenResponse>(
        '/api/Auth/validate-reset-token',
        { params: { token } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to validate reset token:', error);
      throw error;
    }
  },

// ===== FIDO2 WebAuthn =====

  /** FIDO2 開始註冊 */
  async fido2RegisterStart(deviceName?: string): Promise<unknown> {
    const response = await apiClient.post('/api/Auth/fido2/register/start', { deviceName });
    return response.data;
  },

  /** FIDO2 完成註冊 */
  async fido2RegisterComplete(request: Fido2RegisterCompleteRequest): Promise<void> {
    await apiClient.post('/api/Auth/fido2/register/complete', request);
  },

  /** FIDO2 開始認證 */
  async fido2AuthenticateStart(request?: Fido2AuthenticateStartRequest): Promise<unknown> {
    const response = await apiClient.post('/api/Auth/fido2/authenticate/start', request ?? {});
    return response.data;
  },

  /** FIDO2 完成認證 */
  async fido2AuthenticateComplete(request: Fido2AuthenticateCompleteRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/api/Auth/fido2/authenticate/complete', request);
    return response.data;
  },

  /** 取得 FIDO2 憑證列表 */
  async fido2GetCredentials(): Promise<Fido2CredentialInfo[]> {
    const response = await apiClient.get<Fido2CredentialInfo[]>('/api/Auth/fido2/credentials');
    return response.data;
  },

  /** 取得 FIDO2 啟用狀態 */
  async fido2GetStatus(): Promise<{ enabled: boolean }> {
    const response = await apiClient.get<{ enabled: boolean }>('/api/Auth/fido2/status');
    return response.data;
  },

  /** 刪除 FIDO2 憑證 */
  async fido2DeleteCredential(id: string): Promise<void> {
    await apiClient.delete(`/api/Auth/fido2/credentials/${id}`);
  },

  /** 取得密碼策略（公開） */
  async getPasswordPolicy(): Promise<PasswordPolicySettings> {
    const response = await apiClient.get<PasswordPolicySettings>('/api/Auth/password-policy');
    return response.data;
  },
};
