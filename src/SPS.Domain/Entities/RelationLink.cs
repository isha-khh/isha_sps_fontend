using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class RelationLink : BaseEntity<int>
{
    public DataMode DataMode { get; set; }
    public bool Published { get; set; }
    public int Ordinal { get; set; }
    public int ClickCount { get; set; }
    public string? Name { get; set; }
    public string? Introduction { get; set; }
    public string? Content { get; set; }
    public int? PictureId { get; set; }
    public Guid? OperatorId { get; set; }
    public string? Uri { get; set; }

    // Navigation properties
    public Picture? Picture { get; set; }
    public User? Operator { get; set; }
}
