using SPS.Application.Common;
using SPS.Application.DTOs.Banner;
using SPS.Application.DTOs.Common;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// Banner 服務接口
/// </summary>
public interface IBannerService
{
    /// <summary>
    /// 分頁查詢 Banner 列表
    /// </summary>
    Task<Result<PagedResult<BannerListItemResponse>>> GetPagedAsync(
        BannerQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取 Banner 詳情
    /// </summary>
    Task<Result<BannerResponse>> GetByIdAsync(
        long id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 創建 Banner
    /// </summary>
    Task<Result<BannerResponse>> CreateAsync(
        CreateBannerRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新 Banner
    /// </summary>
    Task<Result<BannerResponse>> UpdateAsync(
        long id,
        UpdateBannerRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除 Banner
    /// </summary>
    Task<Result<bool>> DeleteAsync(
        long id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 根據位置 ID 獲取 Banner 列表
    /// </summary>
    Task<Result<List<BannerResponse>>> GetByPositionIdAsync(
        int positionId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 增加 Banner 檢視次數
    /// </summary>
    Task<Result<bool>> IncrementViewCountAsync(
        long id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 增加 Banner 點擊次數
    /// </summary>
    Task<Result<bool>> IncrementClickCountAsync(
        long id,
        CancellationToken cancellationToken = default);
}