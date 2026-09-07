using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 實體-標簽關聯表（多態關聯）
/// 替代 NewsTag, ProductTag, DemandTag, CompanyTags
/// </summary>
public class EntityTag
{
    /// <summary>
    /// 標簽ID
    /// </summary>
    public int TagId { get; set; }

    /// <summary>
    /// 實體類型（News, Product, Demand, Company）
    /// </summary>
    public EntityType EntityType { get; set; }

    /// <summary>
    /// 實體ID（字符串類型以支持 int 和 Guid）
    /// </summary>
    public string EntityId { get; set; } = string.Empty;

    // Navigation properties
    public Tag Tag { get; set; } = null!;
}