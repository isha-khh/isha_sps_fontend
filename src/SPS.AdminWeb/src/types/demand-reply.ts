/** 需求回應審核狀態（對應後端 DemandReplyStatus） */
export type DemandReplyStatus = 'Pending' | 'Approved' | 'Rejected';

export const DemandReplyStatusLabels: Record<DemandReplyStatus, string> = {
  Pending: '待審核',
  Approved: '已通過',
  Rejected: '已退回',
};

/** 供應業者對媒合需求送出的回應（後台審核用） */
export interface DemandReply {
  id: number;
  demandId: number;
  demandNumber: string;
  demandName: string;
  memberId: string;
  companyName?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  content: string;
  status: DemandReplyStatus;
  rejectReason?: string | null;
  createdTime: string;
  reviewedAt?: string | null;
  /** 通過後實際寄出的收件人數 */
  sentCount?: number | null;
  /** 目前會收到這則回應的追蹤者人數（不含刊登者） */
  followerCount: number;
}

export interface DemandReplyCounts {
  pending: number;
  approved: number;
  rejected: number;
}
