namespace SPS.Application.DTOs.News;

/// <summary>
/// 新聞查詢參數
/// </summary>
public class NewsQueryParameters
{
    /// <summary>
    /// 搜索關鍵字（標題、簡介）
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// 分類ID篩選
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// 類型篩選
    /// </summary>
    public short? Type { get; set; }

    /// <summary>
    /// 發布狀態篩選
    /// </summary>
    public bool? Published { get; set; }

    /// <summary>
    /// 標簽ID篩選
    /// </summary>
    public int? TagId { get; set; }

    /// <summary>
    /// 開始日期範圍（起）
    /// </summary>
    public DateTime? StartDateFrom { get; set; }

    /// <summary>
    /// 開始日期範圍（止）
    /// </summary>
    public DateTime? StartDateTo { get; set; }

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
