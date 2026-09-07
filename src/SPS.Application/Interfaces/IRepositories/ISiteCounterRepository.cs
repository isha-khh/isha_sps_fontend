using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 網站計數器倉儲接口
/// </summary>
public interface ISiteCounterRepository : IRepository<SiteCounter, int>
{
    /// <summary>
    /// 取得計數器（只有一筆）
    /// </summary>
    Task<SiteCounter> GetCounterAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 增加瀏覽量
    /// </summary>
    Task<SiteCounter> IncrementPageViewAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 增加訪客數
    /// </summary>
    Task<SiteCounter> IncrementVisitorAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 同時增加訪客數和瀏覽量（新訪客）
    /// </summary>
    Task<SiteCounter> IncrementBothAsync(CancellationToken cancellationToken = default);
}
