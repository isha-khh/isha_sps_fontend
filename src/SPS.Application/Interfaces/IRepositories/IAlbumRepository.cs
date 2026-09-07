using SPS.Application.DTOs.Album;
using SPS.Application.DTOs.Common;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 相簿倉儲接口
/// </summary>
public interface IAlbumRepository : IRepository<Album, int>
{
    /// <summary>
    /// 分頁查詢相簿列表
    /// </summary>
    Task<PagedResult<Album>> GetPagedAsync(
        AlbumQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取相簿（包含關聯數據）
    /// </summary>
    Task<Album?> GetByIdWithIncludesAsync(int id, CancellationToken cancellationToken = default);
}