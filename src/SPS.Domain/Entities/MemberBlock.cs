namespace SPS.Domain.Entities;

/// <summary>會員封鎖：封鎖者不再收到被封鎖者的訊息，雙方在對話裡都不能再傳訊息（解除封鎖後恢復）</summary>
public class MemberBlock
{
    public Guid BlockerMemberId { get; set; }
    public Guid BlockedMemberId { get; set; }
    public DateTime CreatedTime { get; set; } = DateTime.UtcNow;
}
