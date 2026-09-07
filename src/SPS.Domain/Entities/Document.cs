using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class Document : BaseEntity<long>
{
    public bool Approved { get; set; }
    public DateTime? SubmittingTime { get; set; }
    public string? Number { get; set; }
    public string? Title { get; set; }
    public short Type { get; set; }
    public short ContentType { get; set; }
    public int? ContentId { get; set; }
    public Guid? SubmitterId { get; set; }
    public string? Remark { get; set; }
    public Status Status { get; set; }
    public short CurrentSignatureLevel { get; set; }
    public int? CurrentPositionId { get; set; }
    public Guid? CompanyId { get; set; }

    // Navigation properties
    public StringResource? Content { get; set; }
    public Member? Submitter { get; set; }
    public Company? Company { get; set; }
    public ICollection<File> Files { get; set; } = new List<File>();
    public ICollection<Scoring> Scorings { get; set; } = new List<Scoring>();
}
