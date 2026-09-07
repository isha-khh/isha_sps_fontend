using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Picture;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 圖片倉儲接口
/// </summary>
public interface IPictureRepository : IRepository<Picture, int>
{
    /// <summary>
    /// 分頁查詢圖片列表
    /// </summary>
    Task<PagedResult<Picture>> GetPagedAsync(
        PictureQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取圖片（包含關聯數據）
    /// </summary>
    Task<Picture?> GetByIdWithIncludesAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據相簿 ID 獲取圖片列表
    /// </summary>
    Task<List<Picture>> GetByAlbumIdAsync(int albumId, CancellationToken cancellationToken = default);
}