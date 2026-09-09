export interface EmailSettings {
  smtpServer: string;
  port: number;
  userName: string;
  password?: string; // Optional in frontend to avoid clearing it if not changed, though backend DTO has it.
  senderName: string;
  senderEmail: string;
  enableSsl: boolean;
}

export interface GoogleAnalyticsSettings {
  propertyId: string;
  credentialsJson: string;
}

export interface FileStorageSettings {
  uploadPath: string;
  allowedExtensions: string;
  maxFileSizeInMB: number;
}

// ==================== 安全性設定 ====================

export interface SecuritySettings {
  /** 是否啟用登入失敗鎖定機制 */
  enableLoginLockout: boolean;
  /** 最大登入失敗次數 */
  maxFailedAttempts: number;
  /** 鎖定時長（分鐘） */
  lockoutDurationMinutes: number;
  /** 是否強制首次登入修改密碼 */
  requirePasswordChangeOnFirstLogin: boolean;
  /** 是否啟用密碼過期策略 */
  enablePasswordExpiry: boolean;
  /** 密碼過期天數 */
  passwordExpiryDays: number;
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

// ==================== 信件範本設定 ====================

export interface EmailTemplate {
  /** 範本識別碼 */
  key: string;
  /** 範本名稱（顯示用） */
  name: string;
  /** 郵件主旨 */
  subject: string;
  /** HTML 內容 */
  htmlContent: string;
  /** 可用變數列表 */
  availableVariables: string[];
  /** 是否啟用 */
  isActive: boolean;
}

export interface EmailTemplateSettings {
  templates: EmailTemplate[];
}

export interface EmailTemplatePreviewRequest {
  variables: Record<string, string>;
}

export interface EmailTemplateTestRequest {
  toEmail: string;
  variables: Record<string, string>;
}

export interface EmailTemplatePreviewResponse {
  subject: string;
  htmlContent: string;
}
