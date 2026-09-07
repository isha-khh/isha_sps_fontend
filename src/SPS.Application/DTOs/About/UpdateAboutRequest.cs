using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.About;

public class UpdateAboutRequest
{
    [StringLength(100, ErrorMessage = "名稱長度不能超過100")]
    public string? Name { get; set; }

    public string? Title { get; set; }

    public string? Content { get; set; }

    public bool? Published { get; set; }

    public short? Type { get; set; }

    public int? Ordinal { get; set; }

    [StringLength(50, ErrorMessage = "版本號長度不能超過50")]
    public string? Version { get; set; }

    public DateTime? SendTime { get; set; }
}
