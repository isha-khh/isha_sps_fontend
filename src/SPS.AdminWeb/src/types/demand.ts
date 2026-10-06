// 需求張貼相關類型定義

export interface DemandAttachment {
  fileId: string;
  fileName: string;
  formattedFileSize: string;
  url: string;
}

export interface Demand {
  id: string;
  name: string;
  introduction?: string;
  /** 地點（前台列表與詳情顯示） */
  location?: string;
  /** 公開摘要：所有訪客都看得到；完整內容與附件只有企業會員看得到 */
  publicSummary?: string;
  /** 附件（檔案管理中的檔案），詳情 API 回傳 */
  attachments?: DemandAttachment[];
  companyId?: string;
  companyName?: string;
  published: boolean;
  /** 會員從前台「我要刊登」送出的（未發布時就是待審核） */
  memberSubmitted?: boolean;
  createdAt: string;
  /** 後端實際回傳的欄位名稱（列表用它顯示建立時間） */
  createdTime?: string;
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
  location?: string;
  publicSummary?: string;
  /** 附件的檔案 Id（依顯示順序，最多 10 個） */
  attachmentFileIds?: string[];
  companyId?: string;
  published: boolean;
}

export interface UpdateDemandRequest {
  name?: string;
  introduction?: string;
  /** 沒帶＝不更新；空字串＝清除 */
  location?: string;
  publicSummary?: string;
  /** 沒帶＝不更新；空陣列＝清除全部附件 */
  attachmentFileIds?: string[];
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
