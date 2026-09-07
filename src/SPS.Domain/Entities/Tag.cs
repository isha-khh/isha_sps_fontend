using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 統一標簽表 - 整合所有類型的標簽
/// </summary>
public class Tag : BaseEntity<int>
{
    /// <summary>
    /// 標簽類型（新聞、產品、需求、企業）
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

    // Navigation properties
    public Category? Category { get; set; }
    public ICollection<EntityTag> EntityTags { get; set; } = new List<EntityTag>();
}
