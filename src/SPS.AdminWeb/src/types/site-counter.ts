// 網站計數器相關類型定義

export interface SiteCounter {
  totalVisitors: number;
  totalPageViews: number;
}

export interface SetSiteCounterRequest {
  totalVisitors?: number;
  totalPageViews?: number;
}
