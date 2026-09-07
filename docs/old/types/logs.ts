
export interface ActionLog {
  id: number;
  userId?: string;
  userName?: string;
  actionType?: string;
  actionName?: string;
  entityName?: string;
  entityId?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  createdTime: string;
  executionDuration?: number;
  isSuccess: boolean;
  errorMessage?: string;
}

export interface ApplicationLog {
  id: string;
  applicationId: string;
  operatorId?: string;
  operatorName?: string;
  action?: string;
  comment?: string;
  operatedAt: string;
  previousStatus?: number;
  newStatus: number;
}

export interface MailLog {
  id: number;
  subject: string;
  receivers?: string;
  content?: string;
  errorMessage?: string;
  isSuccess: boolean;
  time?: string;
  createdTime: string;
}

export interface LogSearchParams {
  search?: string;
  userId?: string;
  actionType?: string;
  applicationId?: string;
}
