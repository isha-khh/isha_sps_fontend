namespace SPS.Application.DTOs.SuccessCase;

/// <summary>
/// 成功案例查詢參數
/// </summary>
public class SuccessCaseQueryParameters
{
    /// <summary>
    /// 搜索關鍵字（標題、公司名稱、產業）
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// 產業篩選
    /// </summary>
    public string? Industry { get; set; }

    /// <summary>
    /// 標籤篩選
    /// </summary>
    public string? Tag { get; set; }

    /// <summary>
    /// 是否已發布
    /// </summary>
    public bool? IsPublished { get; set; }

    /// <summary>
    /// 發布日期起始
    /// </summary>
    public DateTime? PublishedDateFrom { get; set; }

    /// <summary>
    /// 發布日期結束
    /// </summary>
    public DateTime? PublishedDateTo { get; set; }

    /// <summary>
    /// 頁碼（從1開始）
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
    /// 是否降序排列
    /// </summary>
    public bool Descending { get; set; } = true;
}
