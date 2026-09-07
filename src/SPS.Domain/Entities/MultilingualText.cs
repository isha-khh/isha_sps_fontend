using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class MultilingualText : BaseEntity<int>
{
    public string? DefaultText { get; set; }

    // Navigation properties
    public ICollection<StringResource> StringResources { get; set; } = new List<StringResource>();
    public ICollection<About> AboutTitles { get; set; } = new List<About>();
    public ICollection<About> AboutContents { get; set; } = new List<About>();
    public ICollection<News> NewsTitles { get; set; } = new List<News>();
    public ICollection<News> NewsIntroductions { get; set; } = new List<News>();
    public ICollection<News> NewsContents { get; set; } = new List<News>();
}
