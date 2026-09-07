// 需求張貼相關類型定義

export interface Demand {
  id: string;
  name: string;
  introduction?: string;
  companyId?: string;
  companyName?: string;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  createdByName?: string;
  tagIds?: number[];
  tagNames?: string[];
}

/** 需求標籤綁定結果 (GET/PUT /api/Demand/{id}/tags) */
export interface DemandTagsResponse {
  demandId: number;
  tagIds: number[];
  tagNames: string[];
}

export interface CreateDemandRequest {
  name: string;
  introduction?: string;
  companyId?: string;
  published: boolean;
}

export interface UpdateDemandRequest {
  name?: string;
  introduction?: string;
  published?: boolean;
  /** 發布時要寄送媒合通知的供給端業者 Id 清單；未提供則沿用預設規則（重疊度 ≥30% 全部寄送） */
  notifyCompanyIds?: string[];
}

export interface DemandSearchParams {
  search?: string;
  companyId?: string;
  published?: boolean;
}

export interface DemandStatistics {
  totalDemands: number;
  publishedDemands: number;
  draftDemands: number;
  demandsThisMonth: number;
}

export type DemandNotificationStatus = 0 | 1 | 2; // Pending | Sent | Failed

export interface DemandNotificationRecord {
  id: number;
  companyName: string | null;
  recipientEmail: string;
  status: DemandNotificationStatus;
  errorMessage: string | null;
  sentAt: string | null;
  createdTime: string;
}
