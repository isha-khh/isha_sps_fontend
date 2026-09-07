using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class AttributeValue : BaseEntity<int>
{
    public int AttributeId { get; set; }
    public string? Value { get; set; }
    public string? TextValue { get; set; }
    public decimal? DecimalValue { get; set; }

    // Navigation properties
    public Attribute Attribute { get; set; } = null!;
    public ICollection<EntityAttributeValue> EntityAttributeValues { get; set; } = new List<EntityAttributeValue>();
}
