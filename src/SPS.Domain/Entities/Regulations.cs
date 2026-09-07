using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class Regulations : BaseEntity<int>
{
    public DataMode DataMode { get; set; }
    public string? Name { get; set; }
    public bool Published { get; set; }
    public short Type { get; set; }
    public int Ordinal { get; set; }
    public int? PictureId { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public int? CategoryId { get; set; }

    // Navigation properties
    public Picture? Picture { get; set; }
    public Category? Category { get; set; }
    public ICollection<File> Files { get; set; } = new List<File>();
}
