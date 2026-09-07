// 網站統計數據相關類型定義

export interface SiteStatistics {
  /** 會員總數（由系統自動計算） */
  totalMembers: number;
  /** 媒合成功案例 */
  successfulMatches: number;
  /** 媒合補助申請案次 */
  subsidyApplications: number;
}

export interface SetSiteStatisticsRequest {
  successfulMatches?: number;
  subsidyApplications?: number;
}
