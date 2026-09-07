using SPS.Application.Common;
using SPS.Application.DTOs.SiteStatistics;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 網站統計數據服務介面
/// </summary>
public interface ISiteStatisticsService
{
    /// <summary>
    /// 取得統計數據
    /// </summary>
    Task<Result<SiteStatisticsResponse>> GetStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 設定統計數據
    /// </summary>
    Task<Result<SiteStatisticsResponse>> SetStatisticsAsync(
        int? successfulMatches,
        int? subsidyApplications,
        CancellationToken cancellationToken = default);
}
