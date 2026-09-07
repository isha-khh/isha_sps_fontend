namespace SPS.Application.DTOs.Question;

public class QuestionQueryParameters
{
    /// <summary>
    /// 搜索關鍵字（問題、答案）
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// 分類ID過濾
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// 發布狀態過濾
    /// </summary>
    public bool? Published { get; set; }

    /// <summary>
    /// 頁碼
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// 每頁數量
    /// </summary>
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// 排序字段（ordinal, createdtime）
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// 是否降序
    /// </summary>
    public bool Descending { get; set; } = false;
}
