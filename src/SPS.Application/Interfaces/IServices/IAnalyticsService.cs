using SPS.Application.Common;
using SPS.Application.DTOs.Analytics;

namespace SPS.Application.Interfaces.IServices;

public interface IAnalyticsService
{
    /// <summary>
    /// 手動觸發同步：從 Google Analytics 抓取數據並更新資料庫
    /// </summary>
    /// <param name="daysToSync">要回溯同步的天數 (預設 1 天，即昨天)</param>
    /// <param name="trigger"><c>manual</c>（儀表板按鈕）或 <c>auto</c>（排程），記錄在同步狀態裡</param>
    Task<Result> SyncAnalyticsDataAsync(int daysToSync = 1, string trigger = "manual");

    /// <summary>
    /// 自動同步：到了後台設定的時間、今天還沒成功跑過，就同步最近幾天。由背景服務每分鐘呼叫一次，
    /// 所以服務在排定時間沒開著（重啟、部署），開起來之後會補跑；失敗最多重試 3 次、每次間隔 30 分鐘。回傳這次有沒有真的執行。
    /// </summary>
    Task<bool> RunAutoSyncIfDueAsync(DateTime nowUtc);

    /// <summary>儀表板用：自動同步的設定與最近一次同步結果</summary>
    Task<AnalyticsSyncStatusResponse> GetSyncStatusAsync();

    /// <summary>
    /// 獲取日期範圍內的完整統計報告 (含每日趨勢與維度分佈)
    /// </summary>
    Task<Result<AnalyticsReportDto>> GetAnalyticsReportAsync(DateOnly startDate, DateOnly endDate);
}
