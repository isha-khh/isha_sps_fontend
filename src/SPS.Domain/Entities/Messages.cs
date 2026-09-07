using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class Messages : BaseEntity<long>
{
    public Guid? InitiatorMemberId { get; set; }
    public long? ChatRecordId { get; set; }
    public string? Text { get; set; }
    public bool IsRead { get; set; }

    public Guid? InitiatorUserId { get; set; }

    // Navigation properties
    public Member? InitiatorMember { get; set; }
    public User? InitiatorUser { get; set; }
    public ChatRecord? ChatRecord { get; set; }
    public ICollection<File> Files { get; set; } = new List<File>();
}
