using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.News;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 新聞服務接口
/// </summary>
public interface INewsService
{
    /// <summary>
    /// 分頁查詢新聞列表
    /// </summary>
    Task<Result<PagedResult<NewsListItemResponse>>> GetPagedAsync(
        NewsQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取新聞詳情
    /// </summary>
    Task<Result<NewsResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 創建新聞
    /// </summary>
    Task<Result<NewsResponse>> CreateAsync(
        CreateNewsRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新新聞
    /// </summary>
    Task<Result<NewsResponse>> UpdateAsync(
        int id,
        UpdateNewsRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除新聞
    /// </summary>
    Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取新聞統計數據
    /// </summary>
    Task<Result<NewsStatisticsDto>> GetStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 增加新聞瀏覽次數
    /// </summary>
    Task<Result<int>> IncrementViewCountAsync(int id, CancellationToken cancellationToken = default);
}
