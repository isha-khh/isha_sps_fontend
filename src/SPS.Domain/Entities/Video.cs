using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class Video : BaseEntity<int>
{
    public string? Name { get; set; }
    public string? ContentType { get; set; }
    public string? Uri { get; set; }
    public string? ThumbnailUri { get; set; }
    public string? LinkUrl { get; set; }
    public bool Published { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Ordinal { get; set; }
    public int Height { get; set; }
    public int Width { get; set; }
    public int Dpi { get; set; }
    public string? Remark { get; set; }
    public int? AlbumId { get; set; }

    // Navigation properties
    public Album? Album { get; set; }
}
