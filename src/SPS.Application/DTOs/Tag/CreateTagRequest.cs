using System.ComponentModel.DataAnnotations;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Tag;

public class CreateTagRequest
{
    [Required(ErrorMessage = "標籤類型為必填項")]
    public TagType Type { get; set; }

    [Required(ErrorMessage = "標籤名稱為必填項")]
    [StringLength(100, ErrorMessage = "標籤名稱不能超過 100 個字元")]
    public string Name { get; set; } = string.Empty;

    public int Ordinal { get; set; }

    public int? CategoryId { get; set; }
}