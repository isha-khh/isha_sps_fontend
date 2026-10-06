/** 詢問單種類（對應後端 InquiryType） */
export const InquiryType = {
  ProposeSolution: 1,
  SubscribeSolution: 2,
  DownloadRequest: 3,
  SupportRequest: 4,
  Newsletter: 5,
} as const;
export type InquiryType = (typeof InquiryType)[keyof typeof InquiryType];

export const InquiryTypeLabels: Record<number, string> = {
  1: '我要提案',
  2: '訂閱解方',
  3: '下載申請',
  4: '索取補助資料',
  5: '訂閱電子報',
};

/** 處理狀態（對應後端 InquiryStatus） */
export const InquiryStatus = { New: 0, InProgress: 1, Closed: 2 } as const;
export type InquiryStatus = (typeof InquiryStatus)[keyof typeof InquiryStatus];

export const InquiryStatusLabels: Record<number, string> = { 0: '新進', 1: '處理中', 2: '已結案' };

export interface Inquiry {
  id: string;
  type: InquiryType;
  typeName: string;
  status: InquiryStatus;
  memberId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  unit?: string | null;
  jobTitle?: string | null;
  message?: string | null;
  targetType?: string | null;
  targetKey?: string | null;
  targetTitle?: string | null;
  industry?: string | null;
  handlerNote?: string | null;
  handledTime?: string | null;
  createdTime: string;
}

export interface InquiryCounts {
  new: number;
  inProgress: number;
  closed: number;
}

export interface InquirySearchParams {
  type?: InquiryType;
  status?: InquiryStatus;
  search?: string;
}
