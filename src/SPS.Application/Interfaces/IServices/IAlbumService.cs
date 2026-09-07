using SPS.Application.Common;
using SPS.Application.DTOs.Album;
using SPS.Application.DTOs.Common;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 相簿服務接口
/// </summary>
public interface IAlbumService
{
    /// <summary>
    /// 分頁查詢相簿列表
    /// </summary>
    Task<Result<PagedResult<AlbumListItemResponse>>> GetPagedAsync(
        AlbumQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取相簿詳情
    /// </summary>
    Task<Result<AlbumResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 創建相簿
    /// </summary>
    Task<Result<AlbumResponse>> CreateAsync(
        CreateAlbumRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新相簿
    /// </summary>
    Task<Result<AlbumResponse>> UpdateAsync(
        int id,
        UpdateAlbumRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除相簿
    /// </summary>
    Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default);
}