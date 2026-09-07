using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class Album : BaseEntity<int>
{
    public DataMode DataMode { get; set; }
    public string? Number { get; set; }
    public string? Title { get; set; }
    public bool Published { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Ordinal { get; set; }
    public int? CoverId { get; set; }

    // Navigation properties
    public Picture? Cover { get; set; }
    public ICollection<Picture> Pictures { get; set; } = new List<Picture>();
    public ICollection<Video> Videos { get; set; } = new List<Video>();
}
