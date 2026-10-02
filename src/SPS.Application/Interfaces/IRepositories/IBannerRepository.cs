using SPS.Application.DTOs.Banner;
using SPS.Application.DTOs.Common;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// Banner 倉儲接口
/// </summary>
public interface IBannerRepository : IRepository<Banner, long>
{
    /// <summary>
    /// 分頁查詢 Banner 列表
    /// </summary>
    Task<PagedResult<Banner>> GetPagedAsync(
        BannerQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取 Banner（包含關聯數據）
    /// </summary>
    Task<Banner?> GetByIdWithIncludesAsync(long id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據位置 ID 獲取 Banner 列表
    /// </summary>
    Task<List<Banner>> GetByPositionIdAsync(int positionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得指定版位目前「上架中」的 Banner：Published 且在上下架時間範圍內，依 Ordinal、建立時間排序。
    /// 前台只能看到這份，草稿或已過期的不會外洩。
    /// </summary>
    Task<List<Banner>> GetActiveByPositionCodeAsync(string code, DateTime nowUtc, CancellationToken cancellationToken = default);

    /// <summary>
    /// 所有版位
    /// </summary>
    Task<List<BannerPosition>> GetPositionsAsync(CancellationToken cancellationToken = default);
}