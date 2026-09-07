using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Regulations;

public class CreateRegulationsRequest
{
    [Required(ErrorMessage = "名稱不能為空")]
    [StringLength(200, ErrorMessage = "名稱長度不能超過200")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "標題長度不能超過500")]
    public string? Title { get; set; }

    public string? Content { get; set; }

    public bool Published { get; set; } = true;

    public short Type { get; set; } = 0;

    public int Ordinal { get; set; } = 0;

    public int? CategoryId { get; set; }
}
