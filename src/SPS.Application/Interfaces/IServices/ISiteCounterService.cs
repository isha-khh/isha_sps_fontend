using SPS.Application.Common;
using SPS.Application.DTOs.SiteCounter;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 網站計數器服務接口
/// </summary>
public interface ISiteCounterService
{
    /// <summary>
    /// 取得計數器
    /// </summary>
    Task<Result<SiteCounterResponse>> GetCounterAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 記錄訪問（前台呼叫）
    /// </summary>
    /// <param name="isNewVisitor">是否為新訪客</param>
    /// <param name="cancellationToken">取消權杖</param>
    Task<Result<SiteCounterResponse>> RecordVisitAsync(bool isNewVisitor, CancellationToken cancellationToken = default);

    /// <summary>
    /// 設定計數器（後台用）
    /// </summary>
    Task<Result<SiteCounterResponse>> SetCounterAsync(long? totalVisitors, long? totalPageViews, CancellationToken cancellationToken = default);
}
