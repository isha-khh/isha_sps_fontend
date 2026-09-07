using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Attribute;

/// <summary>
/// 屬性查詢參數
/// </summary>
public class AttributeQueryParameters
{
    /// <summary>
    /// 屬性類型過濾
    /// </summary>
    public AttributeType? Type { get; set; }

    /// <summary>
    /// 分類 ID 過濾
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// 關鍵詞搜索（名稱、代碼）
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// 是否必填過濾
    /// </summary>
    public bool? Required { get; set; }

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
