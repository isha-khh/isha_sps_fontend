using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class News : BaseEntity<int>
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool Published { get; set; }
    public int Ordinal { get; set; }
    public int? TitleId { get; set; }
    public int? IntroductionId { get; set; }
    public int? ContentId { get; set; }
    public int? PictureId { get; set; }
    public int? CategoryId { get; set; }
    public short Type { get; set; }
    public int ViewCount { get; set; }

    // Navigation properties
    public MultilingualText? Title { get; set; }
    public MultilingualText? Introduction { get; set; }
    public MultilingualText? Content { get; set; }
    public MultilingualImage? Picture { get; set; }
    public Category? Category { get; set; }
    public ICollection<File> Files { get; set; } = new List<File>();
}
