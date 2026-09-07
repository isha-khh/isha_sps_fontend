using SPS.Domain.Entities;

namespace SPS.Application.Interfaces;

public interface IGoogleAnalyticsProvider
{
    /// <summary>
    /// 從 Google Analytics 獲取指定日期範圍的數據
    /// </summary>
    /// <param name="startDate">開始日期</param>
    /// <param name="endDate">結束日期</param>
    /// <returns>轉換後的實體列表</returns>
    Task<List<AnalyticsDailyMetric>> FetchAnalyticsDataAsync(DateOnly startDate, DateOnly endDate);

    /// <summary>
    /// 獲取維度分佈數據 (裝置、瀏覽器、國家、語言)
    /// </summary>
    Task<List<AnalyticsDimensionStatistic>> FetchDimensionStatisticsAsync(DateOnly startDate, DateOnly endDate);
}
