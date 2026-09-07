export interface EmailSettings {
  /** 是否啟用郵件服務 */
  isEnabled: boolean;
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

// ==================== 郵件版面配置 ====================

export interface EmailLayoutSettings {
  /** Logo 圖片 URL */
  logoUrl: string;
  /** Logo 最大寬度百分比 */
  logoMaxWidthPercent: number;
  /** 平台名稱 */
  platformName: string;
  /** 標題文字色 */
  primaryColor: string;
  /** 內文文字色 */
  contentColor: string;
  /** 頁尾文字色 */
  footerColor: string;
  /** 頁尾文字（支援 HTML） */
  footerHtml: string;
  /** 版權文字 */
  copyrightText: string;
}

// ==================== FIDO2 Passkey 設定 ====================

export interface Fido2Settings {
  /** 前台會員是否啟用 Passkey 登入 */
  enableForMember: boolean;
  /** 後台管理員是否啟用 Passkey 登入 */
  enableForAdmin: boolean;
  /** 伺服器網域 (RP ID)，例如 isha.net */
  serverDomain?: string;
  /** 伺服器名稱，例如 SPS Platform */
  serverName?: string;
  /** 允許的來源清單 */
  origins?: string[];
}

// ==================== 退信處理設定 ====================

export interface BounceMailSettings {
  /** 是否啟用自動退信處理 */
  enabled: boolean;
  /** IMAP 伺服器地址 */
  imapServer: string;
  /** IMAP 端口（通常 993 for SSL, 143 for TLS） */
  imapPort: number;
  /** 是否使用 SSL */
  useSsl: boolean;
  /** 帳號 */
  username: string;
  /** 密碼 */
  password: string;
  /** 要監控的信箱資料夾（預設 INBOX） */
  folder: string;
  /** 處理後是否刪除退信郵件 */
  deleteAfterProcessing: boolean;
  /** 處理後移動到的資料夾（若不刪除） */
  moveToFolder: string;
  /** 檢查間隔（分鐘） */
  checkIntervalMinutes: number;
}

// ==================== 內容設定 ====================

export interface ContentSettings {
  /** 訪客是否可以查看企業名錄詳情 */
  guestCanViewBusinessDetail: boolean;
  /** 企業列表是否顯示標籤 */
  showBusinessListTags: boolean;
  /** 企業列表是否顯示關於我們 */
  showBusinessListIntroduction: boolean;
  /** 企業列表關於我們最大顯示字元數 */
  businessListIntroductionMaxLength: number;
}

// ==================== 會員申請須知設定 ====================

export interface MembershipGuideSettings {
  /** 石化產業智慧化媒合與應用服務申請須知（PDF）下載連結 */
  guidePdfFileUrl?: string;
  /** 申請須知 PDF 顯示名稱 */
  guidePdfFileName?: string;
  /** 可編輯申請須知附件（DOCX）下載連結 */
  guideDocxFileUrl?: string;
  /** 申請須知附件 DOCX 顯示名稱 */
  guideDocxFileName?: string;
}

export interface BounceProcessingResult {
  totalFound: number;
  processedCount: number;
  skippedCount: number;
  errorCount: number;
  error?: string;
  success: boolean;
}

export interface ProTrackSettings {
  baseUrl: string;
  apiKey: string;
  formId: string;
}

// ==================== AI 語意搜尋設定 ====================

export interface EmbeddingSettings {
  /** 是否啟用 AI 語意搜尋 */
  isEnabled: boolean;
  /** LiteLLM 服務位址 */
  baseUrl: string;
  /** LiteLLM API Key */
  apiKey: string;
  /** Embedding 模型名稱 */
  model: string;
  /** 查詢端 instruction prefix（進階，可留空用預設） */
  queryInstructionPrefix?: string | null;
}

export interface EmbeddingTestResult {
  success: boolean;
  message?: string;
  dimension?: number;
  latencyMs?: number;
}
