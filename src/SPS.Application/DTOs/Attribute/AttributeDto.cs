using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Attribute;

/// <summary>
/// 屬性返回 DTO
/// </summary>
public class AttributeDto
{
    public int Id { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool Selectable { get; set; }
    public bool Multiple { get; set; }
    public bool IsRequired { get; set; }
    public int Ordinal { get; set; }
    public string? Remark { get; set; }
    public AttributeType Type { get; set; }
    public DataMode DataMode { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime? UpdatedTime { get; set; }
}
