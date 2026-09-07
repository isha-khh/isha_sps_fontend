// 對應後端 C# Enum: DeviceCategory=1, Browser=2, Country=3, Language=4
export const AnalyticsDimensionType = {
  DeviceCategory: 1,
  Browser: 2,
  Country: 3,
  Language: 4
} as const;

export type AnalyticsDimensionType = (typeof AnalyticsDimensionType)[keyof typeof AnalyticsDimensionType];

export interface AnalyticsMetric {
  date: string;
  activeUsers: number;
  screenPageViews: number;
  bounceRate: number;
  averageEngagementTime: number;
  screenPageViewsPerSession: number;
}

export interface AnalyticsDistribution {
  dimensionType: AnalyticsDimensionType; // 後端返回數字 1-4
  dimensionValue: string;
  totalUsers: number;
}

export interface AnalyticsReport {
  dailyMetrics: AnalyticsMetric[];
  distributions: AnalyticsDistribution[];
}
