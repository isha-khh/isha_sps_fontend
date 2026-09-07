import type { MemberPosition, MemberRole ,DocumentType as ApiDocType} from "@/types/api.ts";


/**
 * 申請成員 DTO
 */
export interface ApplicationMemberDto {
  id?: string;
  contactName: string;
  position: string;
  email: string;
  phone: string;
  extension?: string;
  mobilePhone?: string;
  password: string;
  confirmPassword: string;
  memberPosition: MemberPosition;
  orderIndex: number;
}

/**
 * 創建申請請求
 */
export interface CreateApplicationRequest {
  memberRole: MemberRole;
  unifiedSocialCreditCode: string;
  contactPerson: string;
  reason?: string;
  members: ApplicationMemberDto[];
}

/**
 * 更新申請請求
 */
export interface UpdateApplicationRequest {
  unifiedSocialCreditCode?: string;
  reason?: string;
  remark?: string;
}

/**
 * 提交申請請求
 */
export interface SubmitAdminApplicationRequest {
  applicationId: string;
  remark?: string;
}

/**
 * 取消申請請求
 */
export interface CancelApplicationRequest {
  reason?: string;
}

/**
 * 上傳文件請求
 */
export interface UploadDocumentRequest {
  applicationId: string;
  type: ApiDocType;
  file: File;
}

/**
 * 審核申請請求
 */
export interface ReviewApplicationRequest {
  applicationId: string;
  reviewerId: string;
  isApproved: boolean;
  reviewComment?: string;
  rejectionReason?: string;
}

/**
 * 驗證結果響應
 */
export interface ValidationResponse {
  valid: boolean;
  error?: string;
}
