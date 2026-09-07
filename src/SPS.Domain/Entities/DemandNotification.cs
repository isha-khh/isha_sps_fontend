using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class DemandNotification : BaseEntity<int>
{
    public int DemandId { get; set; }
    public Demand Demand { get; set; } = null!;

    public Guid? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public string RecipientEmail { get; set; } = string.Empty;

    public DemandNotificationStatus Status { get; set; } = DemandNotificationStatus.Pending;
    public string? ErrorMessage { get; set; }
    public DateTime? SentAt { get; set; }
}

public enum DemandNotificationStatus
{
    Pending = 0,
    Sent = 1,
    Failed = 2
}
