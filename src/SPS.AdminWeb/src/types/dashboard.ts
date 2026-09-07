// Dashboard 統計數據類型

// 即時狀態
export interface RealtimeStats {
  chatUpdates: number;
  onlineMembers: number;
}

// 總量統計
export interface TotalStats {
  totalFiles: number;
  totalApplications: number;
  todayApplications: number;
  totalCompanies: number;
  todayCompanies: number;
}

// 供需概況
export interface SupplyDemandStats {
  demandCount: number;
  supplyCount: number;
}

// 流量分析
export interface TrafficStats {
  visitors: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number; // 秒
  pagesPerSession: number;
}

// 活躍帳號數據（時間序列）
export interface ActiveAccountsData {
  date: string;
  count: number;
}

// 裝置類型分佈
export interface DeviceDistribution {
  desktop: number;
  mobile: number;
  tablet: number;
}

// 瀏覽器類型分佈
export interface BrowserDistribution {
  chrome: number;
  firefox: number;
  safari: number;
  edge: number;
  other: number;
}

// 國家分佈
export interface CountryDistribution {
  country: string;
  count: number;
}

// 語言分佈
export interface LanguageDistribution {
  language: string;
  count: number;
}

// 完整的 Dashboard 數據
export interface DashboardData {
  realtime: RealtimeStats;
  total: TotalStats;
  supplyDemand: SupplyDemandStats;
  traffic: TrafficStats;
  activeAccounts: ActiveAccountsData[];
  deviceDistribution: DeviceDistribution;
  browserDistribution: BrowserDistribution;
  countryDistribution: CountryDistribution[];
  languageDistribution: LanguageDistribution[];
}
