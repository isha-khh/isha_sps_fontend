using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class Attribute : BaseEntity<int>
{
    public int? CategoryId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool Selectable { get; set; }
    public bool Multiple { get; set; }
    public bool Required { get; set; }
    public int Ordinal { get; set; }
    public string? Remark { get; set; }
    public AttributeType Type { get; set; }
    public DataMode DataMode { get; set; }

    // Navigation properties
    public Category? Category { get; set; }
    public ICollection<AttributeValue> AttributeValues { get; set; } = new List<AttributeValue>();
}
