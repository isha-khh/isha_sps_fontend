/** 會員對話檢舉的原因（對應後端 ChatReportReason） */
export type ChatReportReason = 'Harassment' | 'Spam' | 'Fraud' | 'Other';

export const ChatReportReasonLabels: Record<ChatReportReason, string> = {
  Harassment: '騷擾或不當言論',
  Spam: '廣告或垃圾訊息',
  Fraud: '詐騙或可疑',
  Other: '其他',
};

export interface ChatReport {
  id: number;
  chatRecordId: number;
  demandId?: number | null;
  demandName?: string | null;
  reporterName?: string | null;
  reporterCompany?: string | null;
  reportedName?: string | null;
  reportedCompany?: string | null;
  reason: ChatReportReason;
  detail?: string | null;
  /** New＝未處理、Reviewed＝已處理 */
  status: 'New' | 'Reviewed';
  handlerNote?: string | null;
  handledTime?: string | null;
  createdTime: string;
  /** 該對話是否已被關閉（不能再傳訊息） */
  chatClosed: boolean;
}

export interface ChatReportMessage {
  id: number;
  senderMemberId?: string | null;
  senderMemberName?: string | null;
  text?: string | null;
  createdTime: string;
}

/** 檢舉詳情：含被檢舉對話的訊息（只有被檢舉的對話才開放給承辦人員審閱） */
export interface ChatReportDetail extends ChatReport {
  messages: ChatReportMessage[];
}
