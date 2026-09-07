namespace SPS.Domain.Entities;

public class MemberFavorite
{
    public Guid MemberId { get; set; }
    public Guid CompanyId { get; set; }
    public Guid? CompanyId1 { get; set; }

    // Navigation properties
    public Member Member { get; set; } = null!;
    public Company Company { get; set; } = null!;
    public Company? Company1 { get; set; }
}
