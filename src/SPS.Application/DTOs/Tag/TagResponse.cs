using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Tag;

public class TagResponse
{
    public int Id { get; set; }
    public TagType Type { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Ordinal { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int UsageCount { get; set; }

    /// <summary>徽章底色（<c>#RRGGBB</c>）；沒設定就套前台預設樣式</summary>
    public string? BadgeColor { get; set; }

    /// <summary>徽章文字顏色（<c>#RRGGBB</c>）；沒設定就用前台預設（白色）</summary>
    public string? BadgeTextColor { get; set; }

    /// <summary>徽章外框顏色（<c>#RRGGBB</c>）；沒設定就不加外框</summary>
    public string? BadgeBorderColor { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime UpdatedTime { get; set; }
}