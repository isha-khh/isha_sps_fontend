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
}