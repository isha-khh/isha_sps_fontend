using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Category;

public class CategoryQueryParameters
{
    /// <summary>
    /// 分類類型過濾
    /// </summary>
    public CategoryType? Type { get; set; }

    /// <summary>
    /// 搜索關鍵字（名稱）
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// 發布狀態過濾
    /// </summary>
    public bool? Published { get; set; }

    /// <summary>
    /// 父分類ID過濾（null表示根分類）
    /// </summary>
    public int? ParentId { get; set; }

    /// <summary>
    /// 頁碼
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// 每頁數量
    /// </summary>
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// 排序字段（name, ordinal, createdtime）
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// 是否降序
    /// </summary>
    public bool Descending { get; set; } = false;
}
