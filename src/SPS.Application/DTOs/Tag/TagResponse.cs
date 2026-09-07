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
    public DateTime CreatedTime { get; set; }
    public DateTime UpdatedTime { get; set; }
}