using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Category;

public class CategoryResponse
{
    public int Id { get; set; }
    public CategoryType Type { get; set; }
    public string? Name { get; set; }
    public bool Published { get; set; }
    public int Ordinal { get; set; }
    public int? ParentId { get; set; }
    public string? ParentName { get; set; }
    public bool HasChild { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime? UpdatedTime { get; set; }
}
