using System.ComponentModel.DataAnnotations;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Category;

public class CreateCategoryRequest
{
    [Required(ErrorMessage = "分類類型不能為空")]
    public CategoryType Type { get; set; }

    [Required(ErrorMessage = "分類名稱不能為空")]
    [StringLength(100, ErrorMessage = "分類名稱長度不能超過100")]
    public string Name { get; set; } = string.Empty;

    public bool Published { get; set; } = true;

    public int Ordinal { get; set; } = 0;

    public int? ParentId { get; set; }

    [StringLength(500, ErrorMessage = "備註長度不能超過500")]
    public string? Remark { get; set; }
}
