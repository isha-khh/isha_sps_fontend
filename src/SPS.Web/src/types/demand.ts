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
