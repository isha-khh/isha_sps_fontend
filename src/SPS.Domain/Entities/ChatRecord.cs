using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class ChatRecord : BaseEntity<long>
{
    public DataMode DataMode { get; set; }
    public string? Name { get; set; }
    public string? Number { get; set; }
    public short Type { get; set; }
    public ChatStatus Status { get; set; } = ChatStatus.Waiting;
    public Guid? InitiatorCompanyId { get; set; }
    public Guid? TargetCompanyId { get; set; }
    public Guid? InitiatorMemberId { get; set; }
    public Guid? InitiatorUserId { get; set; }
    public Guid? TargetMemberId { get; set; }
    public Guid? TargetUserId { get; set; }

    // Navigation properties
    public Company? InitiatorCompany { get; set; }
    public Company? TargetCompany { get; set; }
    public Member? InitiatorMember { get; set; }
    public Member? TargetMember { get; set; }
    public User? InitiatorUser { get; set; }
    public User? TargetUser { get; set; }
    public ICollection<Messages> Messages { get; set; } = new List<Messages>();
}
