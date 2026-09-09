export interface AdminUserInfo {
  id: string;
  account: string;
  name: string;
  email: string;
  avatarFileId?: string | null;
  avatarUrl?: string | null;
  roles: Roles[];
  permissions?: string[];
  lastLoginAt?: string;
  createdAt?: string;
}

export interface UpdateAvatarRequest {
  fileId: string | null;
}
export interface Roles{
  id:string;
  name:string;
  description:string;
  permissions:string;
}
import type { CaptchaData } from './captcha';

export interface AdminLoginRequest {
  email: string;
  password: string;
  captcha?: CaptchaData;
}

export interface AdminRegisterRequest {
  name: string;
  account?: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SystemInitResponse {
  init: boolean; // true = 需要初始化（系統未初始化）, false = 已經初始化
  message?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
  captcha?: CaptchaData;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ValidateResetTokenResponse {
  valid: boolean;
  email: string;
}
