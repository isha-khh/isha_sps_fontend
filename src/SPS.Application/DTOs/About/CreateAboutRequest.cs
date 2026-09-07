using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.About;

public class CreateAboutRequest
{
    [Required(ErrorMessage = "名稱不能為空")]
    [StringLength(100, ErrorMessage = "名稱長度不能超過100")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "標題不能為空")]
    public string Title { get; set; } = string.Empty;

    public string? Content { get; set; }

    public bool Published { get; set; } = true;

    public short Type { get; set; } = 0;

    public int Ordinal { get; set; } = 0;

    [StringLength(50, ErrorMessage = "版本號長度不能超過50")]
    public string? Version { get; set; }

    public DateTime? SendTime { get; set; }
}
