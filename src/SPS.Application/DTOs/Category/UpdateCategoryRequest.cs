using System.ComponentModel.DataAnnotations;
using SPS.Application.DTOs.Common;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Category;

public class UpdateCategoryRequest
{
    [StringLength(100, ErrorMessage = "分類名稱長度不能超過100")]
    public string? Name { get; set; }

    public bool? Published { get; set; }

    public int? Ordinal { get; set; }

    public int? ParentId { get; set; }

    [StringLength(500, ErrorMessage = "備註長度不能超過500")]
    public string? Remark { get; set; }

    /// <summary>徽章底色，格式 <c>#RRGGBB</c>；更新時 null＝不變、空字串＝清除（恢復預設樣式）</summary>
    [BadgeColor]
    public string? BadgeColor { get; set; }

    /// <summary>徽章文字顏色，格式同上</summary>
    [BadgeColor]
    public string? BadgeTextColor { get; set; }

    /// <summary>徽章外框顏色，格式同上</summary>
    [BadgeColor]
    public string? BadgeBorderColor { get; set; }
}
