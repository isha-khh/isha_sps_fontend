/**
 * 操作日誌每日趨勢項目
 */
export interface ActionLogDailyTrendItem {
  date: string;
  total: number;
  success: number;
  failure: number;
}

/**
 * 操作日誌統計資料
 */
export interface ActionLogStatistics {
  totalCount: number;
  successCount: number;
  failureCount: number;
  avgExecutionDuration: number;
  actionTypeDistribution: Record<string, number>;
  entityTypeDistribution: Record<string, number>;
  dailyTrend: ActionLogDailyTrendItem[];
}

/**
 * 日期範圍預設選項
 */
export type DateRangePreset = 'today' | '7d' | '30d' | '90d' | 'custom';

/**
 * 日期範圍
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}
