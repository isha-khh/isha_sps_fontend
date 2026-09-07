using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Video;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 影片服務接口
/// </summary>
public interface IVideoService
{
    /// <summary>
    /// 分頁查詢影片列表
    /// </summary>
    Task<Result<PagedResult<VideoListItemResponse>>> GetPagedAsync(
        VideoQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取影片詳情
    /// </summary>
    Task<Result<VideoResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 創建影片
    /// </summary>
    Task<Result<VideoResponse>> CreateAsync(
        CreateVideoRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新影片
    /// </summary>
    Task<Result<VideoResponse>> UpdateAsync(
        int id,
        UpdateVideoRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除影片
    /// </summary>
    Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據相簿 ID 獲取影片列表
    /// </summary>
    Task<Result<List<VideoResponse>>> GetByAlbumIdAsync(
        int albumId,
        CancellationToken cancellationToken = default);
}