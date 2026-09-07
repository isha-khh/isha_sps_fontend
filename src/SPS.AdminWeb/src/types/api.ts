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
export interface Application {
  id: string;
  applicationNumber: string;
  memberRole: MemberRole;
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
  contactPerson?: string;
  isManualInput: boolean;
  businessScope?: string;
  companyAddress?: string;

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

// 文檔類型
export const DocumentType = {
  CompanyRegistration: 1,
  PersonalDataConsent: 2,
  TechnicalCapability: 3,
  CloudMarketplace: 4,
  DigitalServiceCapability: 5,
  Application: 6,
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
