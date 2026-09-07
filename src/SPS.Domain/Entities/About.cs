using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class About : BaseEntity<int>
{
    public DataMode DataMode { get; set; }
    public string? Name { get; set; }
    public bool Published { get; set; }
    public short Type { get; set; }
    public int Ordinal { get; set; }
    public int? PictureId { get; set; }
    public int? TitleId { get; set; }
    public int? ContentId { get; set; }
    public string? Version { get; set; }
    public DateTime? SendTime { get; set; }

    // Banner specific fields
    public string? ImageUrl { get; set; }
    public string? LinkUrl { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; }

    // Link specific fields
    public string? Url { get; set; }
    public string? Icon { get; set; }
    public bool OpenInNewTab { get; set; }

    // Page specific fields
    public string? Slug { get; set; }
    public string? Excerpt { get; set; }
    public bool IsPublished { get; set; }

    // EmailTemplate specific fields
    public string? Subject { get; set; }
    public string? Variables { get; set; } // JSON array of variable names

    // Album specific fields
    public string? CoverImageUrl { get; set; }
    public int? ImageCount { get; set; }

    // Navigation properties
    public MultilingualImage? Picture { get; set; }
    public MultilingualText? Title { get; set; }
    public MultilingualText? Content { get; set; }
    public ICollection<File> Files { get; set; } = new List<File>();
}
