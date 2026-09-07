using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class Resource : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public string? Content { get; set; }
    public string? Uri { get; set; }
}
