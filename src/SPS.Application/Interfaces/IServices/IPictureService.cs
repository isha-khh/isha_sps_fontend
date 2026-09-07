using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Picture;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 圖片服務接口
/// </summary>
public interface IPictureService
{
    /// <summary>
    /// 分頁查詢圖片列表
    /// </summary>
    Task<Result<PagedResult<PictureListItemResponse>>> GetPagedAsync(
        PictureQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取圖片詳情
    /// </summary>
    Task<Result<PictureResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 創建圖片
    /// </summary>
    Task<Result<PictureResponse>> CreateAsync(
        CreatePictureRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新圖片
    /// </summary>
    Task<Result<PictureResponse>> UpdateAsync(
        int id,
        UpdatePictureRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除圖片
    /// </summary>
    Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據相簿 ID 獲取圖片列表
    /// </summary>
    Task<Result<List<PictureResponse>>> GetByAlbumIdAsync(
        int albumId,
        CancellationToken cancellationToken = default);
}