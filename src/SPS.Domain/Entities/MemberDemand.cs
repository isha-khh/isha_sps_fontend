namespace SPS.Domain.Entities;

public class MemberDemand
{
    public Guid MemberId { get; set; }
    public int DemandId { get; set; }
    public int? DemandId1 { get; set; }

    // Navigation properties
    public Member Member { get; set; } = null!;
    public Demand Demand { get; set; } = null!;
    public Demand? Demand1 { get; set; }
}
