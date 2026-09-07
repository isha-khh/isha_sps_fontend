using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

public interface IAnalyticsRepository : IRepository<AnalyticsDailyMetric, int>
{
    /// <summary>
    /// 根據日期範圍獲取數據
    /// </summary>
    Task<List<AnalyticsDailyMetric>> GetByDateRangeAsync(DateOnly startDate, DateOnly endDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據日期獲取單筆數據
    /// </summary>
    Task<AnalyticsDailyMetric?> GetByDateAsync(DateOnly date, CancellationToken cancellationToken = default);

    // Dimension Statistics Methods
    
    /// <summary>
    /// 獲取日期範圍內的維度統計
    /// </summary>
    Task<List<AnalyticsDimensionStatistic>> GetDimensionsByDateRangeAsync(DateOnly startDate, DateOnly endDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據日期、類型、值獲取維度統計 (用於檢查是否存在)
    /// </summary>
    Task<AnalyticsDimensionStatistic?> GetDimensionAsync(DateOnly date, Domain.Enums.AnalyticsDimensionType type, string value, CancellationToken cancellationToken = default);

    Task AddDimensionAsync(AnalyticsDimensionStatistic entity, CancellationToken cancellationToken = default);
    Task UpdateDimensionAsync(AnalyticsDimensionStatistic entity, CancellationToken cancellationToken = default);
}
