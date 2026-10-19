// 備忘錄（MOU）相關類型定義

export const MouStatus = {
  Draft: 'Draft',
  Active: 'Active',
  Expired: 'Expired',
  Terminated: 'Terminated',
} as const;

export type MouStatusType = (typeof MouStatus)[keyof typeof MouStatus];

export interface Mou {
  id: number;
  title: string;
  companyId: number;
  companyName: string;
  signDate?: string;
  startDate?: string;
  endDate?: string;
  status: MouStatusType;
  description?: string;
  attachments?: string[];
  createdTime: string;
  updatedTime?: string;
}

export interface CreateMouRequest {
  title: string;
  companyId: number;
  signDate?: string;
  startDate?: string;
  endDate?: string;
  status: MouStatusType;
  description?: string;
  attachments?: string[];
}

export interface UpdateMouRequest {
  title?: string;
  companyId?: number;
  signDate?: string;
  startDate?: string;
  endDate?: string;
  /** 日期沒帶＝不更新，所以清除日期要另外帶 true */
  clearSignDate?: boolean;
  clearStartDate?: boolean;
  clearEndDate?: boolean;
  status?: MouStatusType;
  description?: string;
  attachments?: string[];
}

export interface MouSearchParams {
  search?: string;
  companyId?: number;
  status?: MouStatusType;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
}

export interface MouStatistics {
  totalMous: number;
  activeMous: number;
  expiredMous: number;
  draftMous: number;
}
