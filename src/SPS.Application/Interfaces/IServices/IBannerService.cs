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
    /// 依版位代碼取得目前上架中的 Banner（前台用，不含草稿與已過期）
    /// </summary>
    Task<Result<List<BannerResponse>>> GetActiveByPositionCodeAsync(
        string code,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得所有 Banner 版位（後台下拉選單用）
    /// </summary>
    Task<Result<List<BannerPositionResponse>>> GetPositionsAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 增加 Banner 檢視次數
    /// </summary>
    Task<Result<bool>> IncrementViewCountAsync(
        long id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 批次累計曝光：只計算目前「上架中」的 Banner，草稿／已下架／已過期的不算。
    /// 回傳實際累計的筆數。
    /// </summary>
    Task<Result<int>> RecordViewsAsync(
        IReadOnlyCollection<long> ids,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 增加 Banner 點擊次數
    /// </summary>
    Task<Result<bool>> IncrementClickCountAsync(
        long id,
        CancellationToken cancellationToken = default);
}