using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Video;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 影片倉儲接口
/// </summary>
public interface IVideoRepository : IRepository<Video, int>
{
    /// <summary>
    /// 分頁查詢影片列表
    /// </summary>
    Task<PagedResult<Video>> GetPagedAsync(
        VideoQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取影片（包含關聯數據）
    /// </summary>
    Task<Video?> GetByIdWithIncludesAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據相簿 ID 獲取影片列表
    /// </summary>
    Task<List<Video>> GetByAlbumIdAsync(int albumId, CancellationToken cancellationToken = default);
}