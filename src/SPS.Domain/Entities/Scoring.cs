using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class Scoring : BaseEntity<long>
{
    public long? DocumentId { get; set; }
    public Guid? SubmitterId { get; set; }
    public Guid? CompanyId { get; set; }
    public string? Remark { get; set; }
    public decimal? Score { get; set; }

    // Navigation properties
    public Document? Document { get; set; }
    public Member? Submitter { get; set; }
    public Company? Company { get; set; }
}
