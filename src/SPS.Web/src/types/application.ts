// Application related types based on backend DTOs

export { DocumentType } from '@/types/api';

export interface ApplicationMemberDto {
  contactName: string;
  position: string;
  email: string;
  phone: string;
  extension?: string;
  mobilePhone?: string;
  password: string;
  confirmPassword: string;
  memberPosition: number;
  orderIndex: number;
}

/** 申請時填寫的公司專頁資料（對應後端 `CompanyProfileDto`），審核通過後帶進公司資料 */
export interface CompanyProfile {
  phone?: string;
  city?: string;
  district?: string;
  establishmentDate?: string;
  revenue?: number;
  orgUrl?: string;
  introduction?: string;
  subject?: string;
  awardNote?: string;
  tagIds: number[];
  factoryName?: string;
  factoryCity?: string;
  factoryDistrict?: string;
  factoryAddress?: string;
}

export interface CreateApplicationRequest {
  applicantType: ApplicantType;
  existingMemberId?: string;
  memberRole: MemberRole;
  supplierTier?: CompanyLevel;
  unifiedSocialCreditCode?: string;
  contactPerson?: string;
  companyName?: string;
  industry?: string;
  companyAddress?: string;
  businessScope?: string;
  profile?: CompanyProfile;
  reason?: string;
  members: ApplicationMemberDto[];
}

export interface UpdateApplicationRequest {
  contactName?: string;
  phone?: string;
  extension?: string | null;
  mobilePhone?: string | null;
  position?: string | null;
  unifiedSocialCreditCode?: string;
  reason?: string | null;
  remark?: string | null;
}

export interface SubmitApplicationRequest {
  applicationId: string;
  remark?: string | null;
}

export interface ApplicationMemberResponse {
  id: string;
  contactName: string;
  position: string;
  email: string;
  phone: string;
  extension?: string;
  mobilePhone?: string;
  memberPosition: MemberRole;
  orderIndex: number;
  status: ApplicationStatus;
  createdMemberId?: string;
  createdTime: string;
}

/**
 * 會員角色。數值要跟後端 `SPS.Domain.Enums.MemberRole` 對齊
 * （`None=0,Supplier=1,Buyer=2`）——後端沒有啟用
 * `JsonStringEnumConverter`，送出的是數字，對不上後端送出去會被
 * 判定成錯的角色且不會報錯（這裡原本是 `{Supplier:0,Buyer:1}`，
 * 送出去的 0/1 會被後端解讀成 None/Supplier，不是預期的
 * Supplier/Buyer——2026-10-01 接真的註冊 API 時發現並修正）。
 */
export const MemberRole = {
  /** 個人會員 - 不隸屬需求/供給任一端 */
  None: 0,
  /** 供給端 - 提供產品/服務的企業 */
  Supplier: 1,
  /** 需求端 - 采購產品/服務的企業 */
  Buyer: 2,
} as const;
export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];

/**
 * 申請人類型（個人會員/企業會員），對齊後端
 * `SPS.Domain.Enums.ApplicantType`。
 */
export const ApplicantType = {
  Individual: 1,
  Company: 2,
} as const;
export type ApplicantType = (typeof ApplicantType)[keyof typeof ApplicantType];

/**
 * 企業會員分級，對齊後端 `SPS.Domain.Enums.CompanyLevel`——只是審查
 * 路徑紀錄（卓越＝已有政府資格驗證，新興＝委員審查），不是分級高低。
 */
export const CompanyLevel = {
  Standard: 0,
  Excellent: 1,
  Emerging: 2,
} as const;
export type CompanyLevel = (typeof CompanyLevel)[keyof typeof CompanyLevel];


/// <summary>
/// 申請狀態
/// </summary>
export const ApplicationStatus = {
  /// <summary>
  /// 草稿 - 未提交
  /// </summary>
  Draft: 0,
  /// <summary>
  /// 待審核 - 已提交等待審核
  /// </summary>
  PendingReview: 1,
  /// <summary>
  /// 審核中 - 已被審核員領取
  /// </summary>
  UnderReview: 2,
  /// <summary>
  /// 已通過 - 審核通過
  /// </summary>
  Approved: 3,
  /// <summary>
  /// 已拒絕 - 審核未通過
  /// </summary>
  Rejected: 4,
  /// <summary>
  /// 已取消 - 用戶取消申請
  /// </summary>
  Cancelled: 5
} as const;

export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];


export interface DocumentResponse {
  id: string;
  type: number;
  fileName: string;
  filePath: string;
  contentType: string;
  fileSize: number;
  fileHash: string;
  expiresAt: string;
  createdTime: string;
}

export interface ApplicationLogResponse {
  id: string;
  fromStatus?: ApplicationStatus;
  toStatus?: ApplicationStatus;
  operatorId?: string;
  operatorName?: string;
  action: string;
  comment?: string;
  ipAddress?: string;
  operatedAt: string;
}

export interface ApplicationResponse {
  id: string;
  applicationNumber: string;
  applicantType: ApplicantType;
  existingMemberId?: string;
  memberRole: MemberRole;
  supplierTier?: CompanyLevel;
  status: number;
  /** 新興會員委員評分警示（非阻斷性），只有新興會員申請才可能有值 */
  scoringWarning?: string;
  email: string;
  contactName: string;
  phone: string;
  extension?: string;
  mobilePhone?: string;
  position?: string;
  companyId?: string;
  unifiedSocialCreditCode: string;
  companyName?: string;
  industry?: string;
  contactPerson?: string;
  isManualInput: boolean;
  businessScope?: string;
  companyAddress?: string;
  profile?: CompanyProfile;
  reason?: string;
  remark?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewStartedAt?: string;
  reviewedAt?: string;
  reviewComment?: string;
  rejectionReason?: string;
  submittedAt?: string;
  createdTime: string;
  updatedTime?: string;
  members?: ApplicationMemberResponse[];
  documents?: DocumentResponse[];
  logs?: ApplicationLogResponse[];
}

/**
 * 對應後端 `GET /api/Applications/{id}/validate` 真正回傳的格式
 * （`{valid, error}`，驗證失敗時用 HTTP 400 回傳同一個形狀，不是
 * `{isValid, errors}`——這支型別原本寫錯，從沒被接上去過所以沒人
 * 發現，2026-10-01 接真的註冊流程時才對照後端程式碼修正）。
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 申請進度查詢結果（`POST /api/Applications/status`）。只含申請人本來就會在郵件裡收到的資訊。
 */
export interface ApplicationStatusResponse {
  applicationNumber: string;
  status: number;
  /** 狀態中文說明，給畫面直接顯示 */
  statusText: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  /** 只有「審核未通過」才有值 */
  rejectionReason?: string | null;
  /** 已通過：可以用註冊時的信箱與密碼登入 */
  canLogin: boolean;
}
