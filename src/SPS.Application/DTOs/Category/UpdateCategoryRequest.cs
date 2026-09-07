using System.ComponentModel.DataAnnotations;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Category;

public class UpdateCategoryRequest
{
    [StringLength(100, ErrorMessage = "分類名稱長度不能超過100")]
    public string? Name { get; set; }

    public bool? Published { get; set; }

    public int? Ordinal { get; set; }

    public int? ParentId { get; set; }

    [StringLength(500, ErrorMessage = "備註長度不能超過500")]
    public string? Remark { get; set; }
}
