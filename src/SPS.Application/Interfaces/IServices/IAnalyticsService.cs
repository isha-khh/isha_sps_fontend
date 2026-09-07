using SPS.Application.Common;
using SPS.Application.DTOs.Analytics;

namespace SPS.Application.Interfaces.IServices;

public interface IAnalyticsService
{
    /// <summary>
    /// 手動觸發同步：從 Google Analytics 抓取數據並更新資料庫
    /// </summary>
    /// <param name="daysToSync">要回溯同步的天數 (預設 1 天，即昨天)</param>
    Task<Result> SyncAnalyticsDataAsync(int daysToSync = 1);

    /// <summary>
    /// 獲取日期範圍內的完整統計報告 (含每日趨勢與維度分佈)
    /// </summary>
    Task<Result<AnalyticsReportDto>> GetAnalyticsReportAsync(DateOnly startDate, DateOnly endDate);
}
