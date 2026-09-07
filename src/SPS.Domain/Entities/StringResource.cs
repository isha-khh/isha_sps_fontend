using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class StringResource : BaseEntity<int>
{
    public string? Culture { get; set; }
    public string? ContentType { get; set; }
    public string? Content { get; set; }
    public string? Uri { get; set; }
    public bool IsDefault { get; set; }
    public bool Downloadable { get; set; }
    public bool IsNew { get; set; }
    public int? MultilingualTextId { get; set; }

    // Navigation properties
    public MultilingualText? MultilingualText { get; set; }
}
