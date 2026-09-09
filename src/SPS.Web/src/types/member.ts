// 會員相關類型定義

export const MemberStatus = {
  Inactive: 0,
  Active: 1,
  Suspended: 2,
  Locked: 3,
  PendingApproval: 4,
  Approved: 5,
  Rejected: 6
} as const;

export type MemberStatus = typeof MemberStatus[keyof typeof MemberStatus];

export const MemberRole = {
  Supplier: 1,  // 供給端
  Buyer: 2      // 需求端
} as const;

export type MemberRole = typeof MemberRole[keyof typeof MemberRole];

export const MemberPosition = {
  Manager: 1,   // 經理
  Employee: 2   // 員工
} as const;

export type MemberPosition = typeof MemberPosition[keyof typeof MemberPosition];

export interface Member {
  id: string;
  number?: string;
  email: string;
  name: string;
  phone?: string;
  extension?: string;
  mobilePhone?: string;
  companyId?: string;
  companyName?: string;
  position?: string;
  memberJobTitle?: string;
  status: MemberStatus;
  role: MemberRole;
  memberPosition: MemberPosition;
  isApproved: boolean;
  isEmailVerified?: boolean;
  emailVerifiedAt?: string;
  remark?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
  // 密碼相關欄位
  firstChanged: boolean;
  passwordChanged: boolean;
  passwordChangedTime?: string;
  lockedTime?: string;
  loginFailure: number;
}

export interface UpdateMemberRequest {
  name?: string;
  phone?: string;
  extension?: string;
  mobilePhone?: string;
  status?: MemberStatus;
  remark?: string;
  memberJobTitle?: string;
  position?: string;
  requirePasswordChange?: boolean;
}

export interface AdminResetMemberPasswordRequest {
  newPassword?: string;
  requireChangeOnLogin?: boolean;
  sendNotificationEmail?: boolean;
}

export interface MemberStatistics {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  locked: number;
  withCompany: number;
  withoutCompany: number;
}

export interface MemberSearchParams {
  search?: string;
  status?: MemberStatus;
  role?: MemberRole;
  hasCompany?: boolean;
  companyId?: string;
  isApproved?: boolean;
  isEmailVerified?: boolean;
}

// 會員列表項目
export interface MemberListItem {
  id: string;
  name: string;
  email: string;
  mobilePhone?: string;
  companyId?: string;
  companyName?: string;
  status: MemberStatus;
  role: MemberRole;
  isApproved: boolean;
  isEmailVerified?: boolean;
  lastLoginAt?: string;
  createdAt: string;
}
