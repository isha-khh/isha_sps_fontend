namespace SPS.Application.DTOs.Common;

/// <summary>
/// 查詢參數基類
/// </summary>
public class QueryParameters
{
    /// <summary>
    /// 搜索關鍵字
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// 頁碼
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// 每頁數量
    /// </summary>
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// 排序字段
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// 是否降序
    /// </summary>
    public bool Descending { get; set; } = true;
}