using System.ComponentModel.DataAnnotations;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Tag;

public class UpdateTagRequest
{
    public TagType? Type { get; set; }

    [StringLength(100, ErrorMessage = "標籤名稱不能超過 100 個字元")]
    public string? Name { get; set; }

    public int? Ordinal { get; set; }

    public int? CategoryId { get; set; }
}