/**
 * 網站統計數據
 */
export interface SiteStatistics {
    /** 會員總數（系統自動計算） */
    totalMembers: number;
    /** 媒合成功案例 */
    successfulMatches: number;
    /** 媒合補助申請案次 */
    subsidyApplications: number;
}
