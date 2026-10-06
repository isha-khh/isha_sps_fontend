// 通用分頁響應
import type {ApplicationLog} from "@/types/logs.ts";

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 通用分頁請求
export interface PagedRequest {
  pageIndex?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
}

// 會員類型
export interface Member {
  id: string;
  email: string;
  name: string;
  phone?: string;
  companyName?: string;
  createdAt: string;
  updatedAt: string;
}

// 會員角色
export const MemberRole = {
  /** 個人會員——不隸屬需求/供給任一端（對應後端 MemberRole.None） */
  None: 0,
  Supplier: 1,
  Buyer: 2,
  SuperAdmin: 10,
  Reviewer: 11,
  Editor: 12,
  CustomerService: 13,
} as const;

export type MemberRole = typeof MemberRole[keyof typeof MemberRole];

// 申請狀態
export const ApplicationStatus = {
  Draft: 0,
  PendingReview: 1,
  UnderReview: 2,
  Approved: 3,
  Rejected: 4,
  Cancelled: 6,
} as const;

export type ApplicationStatus = typeof ApplicationStatus[keyof typeof ApplicationStatus];

// 會員職位
export const MemberPosition = {
  Manager: 1,
  Employee: 2,
} as const;

export type MemberPosition = typeof MemberPosition[keyof typeof MemberPosition];

// 申請成員
export interface ApplicationMember {
  id: string;
  contactName: string;
  position: string;
  email: string;
  phone: string;
  extension?: string;
  mobilePhone?: string;
  memberPosition: MemberPosition;
  orderIndex: number;
  status: number;
  createdMemberId?: string;
  createdTime: string;
}

// 申請
/** 申請人類型，對應後端 ApplicantType */
export const ApplicantType = {
  Individual: 1,
  Company: 2,
} as const;

export type ApplicantType = typeof ApplicantType[keyof typeof ApplicantType];

export interface Application {
  id: string;
  applicationNumber: string;
  /** 個人會員／企業會員；改版前的舊申請後端已回填為 Company */
  applicantType?: ApplicantType;
  /** 有值代表這是既有個人會員送出的升級申請 */
  existingMemberId?: string;
  memberRole: MemberRole;
  /** 供給端申請分流：1 卓越（文件審查）／2 新興（需專家委員評分），沿用 CompanyLevel 數值 */
  supplierTier?: number;
  /** 新興會員評分未達門檻或尚未輸入評分時的非阻斷性警示（只有審核詳情回應才會帶） */
  scoringWarning?: string;
  status: ApplicationStatus;

  // 申請人信息（第一個成員的信息，保留向後兼容）
  email: string;
  contactName: string;
  phone: string;
  extension?: string;
  mobilePhone?: string;
  position?: string;

  // 企業信息
  companyId?: string;
  unifiedSocialCreditCode: string;
  companyName?: string;
  industry?: string;
  contactPerson?: string;
  isManualInput: boolean;
  businessScope?: string;
  companyAddress?: string;
  /** 申請時填寫的公司專頁資料（核准時帶進公司資料） */
  profile?: ApplicationCompanyProfile;

  // 申請說明
  reason?: string;
  remark?: string;

  // 審核信息
  reviewerId?: string;
  reviewerName?: string;
  reviewStartedAt?: string;
  reviewedAt?: string;
  reviewComment?: string;
  rejectionReason?: string;

  // 時間信息
  submittedAt?: string;
  createdTime: string;
  updatedTime?: string;

  // 關聯數據
  members?: ApplicationMember[];
  documents?: Document[];
  logs?: ApplicationLog[];
}

// 申請日志


// 申請統計
export interface ApplicationStatistics {
  totalApplications: number;
  draft: number;
  pendingReview: number;
  underReview: number;
  approved: number;
  rejected: number;
  cancelled: number;
  todayApplications: number;
}

/** 申請時填寫的公司專頁資料（對應後端 `CompanyProfileDto`） */
export interface ApplicationCompanyProfile {
  phone?: string;
  city?: string;
  district?: string;
  postalCode?: string;
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
  factoryPostalCode?: string;
  factoryAddress?: string;
}

// 文檔類型
export const DocumentType = {
  CompanyRegistration: 1,
  PersonalDataConsent: 2,
  TechnicalCapability: 3,
  CloudMarketplace: 4,
  DigitalServiceCapability: 5,
  Application: 6,
  /** 其他佐證文件（選填） */
  Other: 7,
  /** 公司 LOGO（註冊申請時上傳，審核通過後複製成公司標誌） */
  CompanyLogo: 8,
} as const;

export type DocumentType = typeof DocumentType[keyof typeof DocumentType];

// 文檔
export interface Document {
  id: string;
  type: DocumentType;
  fileName: string;
  filePath: string;
  contentType: string;
  fileSize: number;
  fileHash: string;
  expiresAt?: string;
  createdTime: string;
}

// 新聞
export interface News {
  id: number;
  titleId: number;
  title: string;
  contentId: number;
  content: string;
  imageUrl?: string;
  type?: number;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 關於我們
export interface About {
  id: number;
  nameId: number;
  name: string;
  titleId: number;
  title: string;
  contentId: number;
  content: string;
  type: number;
  ordinal: number;
  published: boolean;
  sendTime?: string;
  createdAt: string;
}

// 標籤
export interface Tag {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

// 常見問題
export interface Question {
  id: number;
  questionId: number;
  question: string;
  answerId: number;
  answer: string;
  type: number;
  ordinal: number;
  published: boolean;
  createdAt: string;
}
