using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.News;
using SPS.Domain.Entities;

namespace SPS.Application.Interfaces.IRepositories;

/// <summary>
/// 新聞倉儲接口
/// </summary>
public interface INewsRepository : IRepository<News, int>
{
    /// <summary>
    /// 分頁查詢新聞列表
    /// </summary>
    Task<PagedResult<News>> GetPagedAsync(
        NewsQueryParameters parameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取所有新聞（無分頁）
    /// </summary>
    Task<List<News>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取新聞（包含關聯數據）
    /// </summary>
    Task<News?> GetByIdWithIncludesAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取新聞的標簽列表
    /// </summary>
    Task<List<string>> GetNewsTagsAsync(int newsId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 批次獲取多筆新聞的標簽列表（分頁列表用，避免逐筆查詢的 N+1 問題）
    /// </summary>
    /// <returns>以新聞 Id 為鍵、標簽名稱列表為值的字典；沒有標簽的新聞不會出現在字典裡</returns>
    Task<Dictionary<int, List<string>>> GetNewsTagsBatchAsync(
        List<int> newsIds, CancellationToken cancellationToken = default);
}
