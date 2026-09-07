namespace SPS.Application.DTOs.Common;

/// <summary>
/// 分頁結果
/// </summary>
public class PagedResult<T>
{
    /// <summary>
    /// 數據列表
    /// </summary>
    public List<T> Items { get; set; } = new();

    /// <summary>
    /// 總記錄數
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// 當前頁碼
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// 每頁數量
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// 總頁數
    /// </summary>
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);

    /// <summary>
    /// 是否有上一頁
    /// </summary>
    public bool HasPreviousPage => Page > 1;

    /// <summary>
    /// 是否有下一頁
    /// </summary>
    public bool HasNextPage => Page < TotalPages;
}
