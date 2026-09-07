using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 網站統計數據 Repository 介面
/// </summary>
public interface ISiteStatisticsRepository
{
    /// <summary>
    /// 取得統計數據（自動建立如果不存在）
    /// </summary>
    Task<SiteStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新統計數據
    /// </summary>
    Task UpdateAsync(SiteStatistics statistics, CancellationToken cancellationToken = default);
}
