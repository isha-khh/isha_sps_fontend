using System.ComponentModel.DataAnnotations;
using SPS.Application.DTOs.Common;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Tag;

public class CreateTagRequest
{
    [Required(ErrorMessage = "標籤類型為必填項")]
    public TagType Type { get; set; }

    [Required(ErrorMessage = "標籤名稱為必填項")]
    [StringLength(100, ErrorMessage = "標籤名稱不能超過 100 個字元")]
    public string Name { get; set; } = string.Empty;

    public int Ordinal { get; set; }

    public int? CategoryId { get; set; }

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