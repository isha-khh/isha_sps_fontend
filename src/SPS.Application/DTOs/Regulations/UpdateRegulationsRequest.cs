using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Regulations;

public class UpdateRegulationsRequest
{
    [StringLength(200, ErrorMessage = "名稱長度不能超過200")]
    public string? Name { get; set; }

    [StringLength(500, ErrorMessage = "標題長度不能超過500")]
    public string? Title { get; set; }

    public string? Content { get; set; }

    public bool? Published { get; set; }

    public short? Type { get; set; }

    public int? Ordinal { get; set; }

    public int? CategoryId { get; set; }
}
