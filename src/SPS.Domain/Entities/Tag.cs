using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 統一標簽表 - 整合所有類型的標簽
/// </summary>
public class Tag : BaseEntity<int>
{
    /// <summary>
    /// 標簽類型（新聞、產品、需求、企業、課程類型）
    /// </summary>
    public TagType Type { get; set; }

    /// <summary>
    /// 標簽名稱
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 排序號
    /// </summary>
    public int Ordinal { get; set; }

    /// <summary>
    /// 所屬分類ID（關聯到統一的 Category 表）
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>徽章底色（<c>#RRGGBB</c>）；沒設定就套前台預設樣式</summary>
    public string? BadgeColor { get; set; }

    /// <summary>徽章文字顏色（<c>#RRGGBB</c>）；沒設定就用前台預設（白色）</summary>
    public string? BadgeTextColor { get; set; }

    /// <summary>徽章外框顏色（<c>#RRGGBB</c>）；沒設定就不加外框</summary>
    public string? BadgeBorderColor { get; set; }

    // Navigation properties
    public Category? Category { get; set; }
    public ICollection<EntityTag> EntityTags { get; set; } = new List<EntityTag>();
}
