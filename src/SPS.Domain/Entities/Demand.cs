using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class Demand : BaseEntity<int>
{
    public DataMode DataMode { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Remark { get; set; }
    public int? PictureId { get; set; }
    public int? CategoryId { get; set; }
    public Guid? CompanyId { get; set; }
    public Status Status { get; set; }

    // Navigation properties
    public Picture? Picture { get; set; }
    public Category? Category { get; set; }
    public Company? Company { get; set; }
    public ICollection<MemberDemand> MemberDemands { get; set; } = new List<MemberDemand>();
    public ICollection<File> Files { get; set; } = new List<File>();
}
