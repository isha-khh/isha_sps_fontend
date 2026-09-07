using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Category;

/// <summary>
/// 分類樹節點
/// </summary>
public class CategoryTreeNode
{
    public int Id { get; set; }
    public CategoryType Type { get; set; }
    public string? Name { get; set; }
    public bool Published { get; set; }
    public int Ordinal { get; set; }
    public int? ParentId { get; set; }
    public bool HasChild { get; set; }
    public List<CategoryTreeNode> Children { get; set; } = new();
}
