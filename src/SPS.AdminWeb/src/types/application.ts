// Application related types based on backend DTOs

export interface ApplicationMemberDto {
  contactName: string;
  position: string;
  email: string;
  phone: string;
  extension?: string;
  mobilePhone?: string;
  memberPosition: number;
  orderIndex: number;
}

export interface CreateApplicationRequest {
  memberRole: number;
  unifiedSocialCreditCode: string;
  contactPerson: string;
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

/// <summary>
/// 會員角色（前台系統）
/// </summary>
export const MemberRole = {
  /// <summary>
  /// 供給端 - 提供產品/服務的企業
  /// </summary>
  Supplier: 0,
  /// <summary>
  /// 需求端 - 采購產品/服務的企業
  /// </summary>
  Buyer: 1,
} as const;
export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];


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
  expiresAt?: string;
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
  memberRole: number;
  status: number;
  email: string;
  contactName: string;
  phone: string;
  extension?: string;
  mobilePhone?: string;
  position?: string;
  companyId?: string;
  unifiedSocialCreditCode: string;
  companyName?: string;
  contactPerson?: string;
  isManualInput: boolean;
  businessScope?: string;
  companyAddress?: string;
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

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}
