using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class MultilingualImage : BaseEntity<int>
{
    public string? DefaultImageUri { get; set; }

    // Navigation properties
    public ICollection<Picture> Pictures { get; set; } = new List<Picture>();
    public ICollection<About> Abouts { get; set; } = new List<About>();
    public ICollection<News> News { get; set; } = new List<News>();
}
