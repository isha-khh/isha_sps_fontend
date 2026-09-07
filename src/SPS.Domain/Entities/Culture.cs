using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class Culture : BaseEntity
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Codes { get; set; }
    public string? Language { get; set; }
    public string? Script { get; set; }
    public ScriptDirection ScriptDirection { get; set; }
    public string? Region { get; set; }
    public string? Currency { get; set; }
    public string? DateFormat { get; set; }
    public string? TimeFormat { get; set; }
    public string? NumberFormat { get; set; }
    public string? CurrencyFormat { get; set; }
    public int Ordinal { get; set; }
    public int? PictureId { get; set; }
    public bool IsDefault { get; set; }

    // Navigation properties
    public Picture? Picture { get; set; }
}
