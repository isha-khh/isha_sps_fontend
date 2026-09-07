using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 實體-屬性值關聯表（多態關聯）
/// 替代 CompanyAttributeValue, ProductAttributeValue, DemandAttributeValue
/// </summary>
public class EntityAttributeValue
{
    /// <summary>
    /// 屬性值ID
    /// </summary>
    public int AttributeValueId { get; set; }

    /// <summary>
    /// 實體類型（Company, Product, Demand）
    /// </summary>
    public EntityType EntityType { get; set; }

    /// <summary>
    /// 實體ID（字符串類型以支持 int 和 Guid）
    /// </summary>
    public string EntityId { get; set; } = string.Empty;

    // Navigation properties
    public AttributeValue AttributeValue { get; set; } = null!;
}