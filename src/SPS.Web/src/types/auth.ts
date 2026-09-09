// Auth related types based on backend DTOs
import type { CaptchaData } from './captcha';

export interface LoginRequest {
  email: string;
  password: string;
  captcha?: CaptchaData;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  extension?: string;
  mobilePhone?: string;
  companyId?: string;
  captcha?: CaptchaData;
}

export interface MemberInfo {
  id: string;
  email: string;
  name: string;
  phone: string;
  extension?: string;
  mobilePhone?: string;
  companyId?: string;
  companyName?: string;
  avatarUrl?: string | null;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  refreshToken?: string;
  member?: MemberInfo;
  requirePasswordChange?: boolean;
  passwordChangeReason?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
}

/**
 * 發送驗證碼請求
 */
export interface SendVerificationCodeRequest {
  email: string;
  purpose: 'ChangePassword' | 'ForgotPassword';
}

/**
 * 會員修改密碼請求（需驗證碼）
 */
export interface MemberChangePasswordRequest {
  email: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 會員忘記密碼請求
 */
export interface MemberForgotPasswordRequest {
  email: string;
}

/**
 * 會員重置密碼請求
 */
export interface MemberResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 驗證重置密碼 Token 回應
 */
export interface MemberValidateResetTokenResponse {
  valid: boolean;
  email: string;
}

// ==================== 密碼策略設定 ====================

export interface PasswordPolicySettings {
  /** 最小長度 */
  minLength: number;
  /** 是否需要大寫字母 */
  requireUppercase: boolean;
  /** 是否需要小寫字母 */
  requireLowercase: boolean;
  /** 是否需要數字 */
  requireDigit: boolean;
  /** 是否需要特殊字元 */
  requireSpecialCharacter: boolean;
  /** 不可重複使用前 N 組密碼 */
  passwordHistoryCount: number;
}