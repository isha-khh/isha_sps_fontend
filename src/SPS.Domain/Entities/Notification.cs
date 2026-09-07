using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class Notification : BaseEntity<long>
{
    public NotificationType Type { get; set; }
    public string? Category { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public string? SendId { get; set; }
    public string? Recipient { get; set; }
    public bool Read { get; set; }
    public DateTime? Expiration { get; set; }
}
