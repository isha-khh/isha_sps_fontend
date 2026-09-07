export interface ActionLog {
  id: number;
  actionType?: string;
  actionName?: string;
  userId?: string;
  userName?: string;
  userType?: string;
  entityType?: string;
  entityTypeName?: string;
  entityId?: string;
  entityName?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  isSuccess: boolean;
  errorMessage?: string;
  executionDuration?: number;
  createdTime: string;
}

export interface ApplicationLog {
  id: string;
  applicationId: string;
  operatorId?: string;
  operatorName?: string;
  action?: string;
  comment?: string;
  previousStatus?: number;
  newStatus: number;
  ipAddress?: string;
  operatedAt: string;
}

export interface MailLog {
  id: number;
  subject?: string;
  receivers?: string;
  receiverCount: number;
  mailType?: string;
  isSuccess: boolean;
  errorMessage?: string;
  time?: string;
  createdTime: string;
  messageId?: string;
  bounceStatus: number; // 0=None, 1=HardBounce, 2=SoftBounce
  bounceStatusText?: string;
  bounceCode?: string;
  bounceReason?: string;
  bounceTime?: string;
}

export interface MailLogDetail extends MailLog {
  content?: string;
  remoteMta?: string;
}

export interface LogSearchParams {
  search?: string;
  userId?: string;
  actionType?: string;
  applicationId?: string;
}

export interface MailLogSearchParams {
  search?: string;
  mailType?: string;
  isSuccess?: boolean;
  /** 0=None, 1=HardBounce, 2=SoftBounce */
  bounceStatus?: number;
  /** true 時只回傳已退信（BounceStatus != None）；同時傳 bounceStatus 則以 bounceStatus 為準 */
  bouncedOnly?: boolean;
  /** ISO 字串，UTC */
  dateFrom?: string;
  dateTo?: string;
  descending?: boolean;
}
