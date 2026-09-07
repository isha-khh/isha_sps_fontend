export const EmailSendMode = {
  Bcc: 0,
  PerRecipient: 1,
} as const;
export type EmailSendMode = (typeof EmailSendMode)[keyof typeof EmailSendMode];

export interface CampaignRecipientFilter {
  /** CompanyType enum 數值（多選） */
  companyTypes?: number[];
  /** CompanyLevel enum 數值（多選） */
  companyLevels?: number[];
  /** 公司 Tag ID（多選） */
  companyTagIds?: number[];
  /** 會員狀態（預設 Active=1） */
  memberStatus?: number;
  /** 會員 DataMode */
  memberDataMode?: number;
}

export interface SendCampaignRequest {
  subject: string;
  body: string;
  companyIds?: string[];
  memberIds?: string[];
  sendMode?: EmailSendMode;
  filter?: CampaignRecipientFilter;
  /** ISO 8601 UTC；null 表示立即排入佇列 */
  scheduleAt?: string | null;
  /** 廣播模式：不限定公司，寄給所有 Active 會員（可搭配 filter 縮窄） */
  broadcast?: boolean;
  /** 是否套用系統郵件版型，預設 true */
  applyLayout?: boolean;
  /** 附件檔案 ID 清單（FileManagement） */
  attachmentFileIds?: string[];
}

export interface PreviewBodyRequest {
  subject: string;
  body: string;
  applyLayout: boolean;
}

export interface PreviewBodyResponse {
  html: string;
}

export interface TestSendCampaignRequest {
  subject: string;
  body: string;
  testEmail: string;
  applyLayout: boolean;
  variables: Record<string, string>;
  attachmentFileIds: string[];
}

export interface CampaignAttachmentItem {
  id: string;
  fileId: string;
  fileName: string;
  contentType?: string;
  fileSize: number;
}

export interface PreviewRecipientRequest {
  companyIds?: string[];
  memberIds?: string[];
  filter?: CampaignRecipientFilter;
  broadcast?: boolean;
}

export interface PreviewRecipientResponse {
  count: number;
}

export interface PreviewRecipientListRequest extends PreviewRecipientRequest {
  limit?: number;
}

export interface RecipientPreviewItem {
  memberId: string;
  email: string;
  name?: string;
  companyName?: string;
  position?: string;
}

export interface PreviewRecipientListResponse {
  totalCount: number;
  items: RecipientPreviewItem[];
}

/** 對應 EmailCampaignStatus enum */
export const EmailCampaignStatus = {
  Draft: 0,
  Queued: 1,
  Sending: 2,
  Completed: 3,
  Failed: 4,
  Cancelled: 5,
} as const;

export type EmailCampaignStatus =
  (typeof EmailCampaignStatus)[keyof typeof EmailCampaignStatus];

export interface CampaignResultResponse {
  campaignId: string;
  totalRecipients: number;
  successBatches: number;
  failedBatches: number;
  status: EmailCampaignStatus;
  startedTime?: string;
  completedTime?: string;
  errorMessage?: string;
}

export interface EnqueueCampaignResponse {
  campaignId: string;
  totalRecipients: number;
  scheduledFor: string;
  status: EmailCampaignStatus;
}

export interface CampaignListItem {
  id: string;
  subject: string;
  status: EmailCampaignStatus;
  statusText?: string;
  sendMode: EmailSendMode;
  scheduleAt?: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  createdBy?: string;
  createdTime: string;
  startedTime?: string;
  completedTime?: string;
  errorMessage?: string;
}

export interface CampaignDetail extends CampaignListItem {
  body: string;
  recipientSnapshot?: string;
  applyLayout?: boolean;
  attachments?: CampaignAttachmentItem[];
}

export interface CampaignListQueryParams {
  page?: number;
  pageSize?: number;
  status?: EmailCampaignStatus;
  search?: string;
}
