using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class Banner : BaseEntity<long>
{
    public string? Name { get; set; }
    public string? ContentType { get; set; }
    public string? Uri { get; set; }
    public string? LinkUrl { get; set; }
    public string? LinkTarget { get; set; } = "_self";
    public int ClickCount { get; set; }
    public int ViewCount { get; set; }
    public string? Remark { get; set; }
    public int? PositionId { get; set; }

    // Navigation properties
    public BannerPosition? Position { get; set; }
}
