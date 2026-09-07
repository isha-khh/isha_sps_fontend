using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class VerificationRecord : BaseEntity<int>
{
    public NotificationType NotificationType { get; set; }
    public string Target { get; set; } = string.Empty;
    public short Type { get; set; }
    public string? Code { get; set; }
    public DateTime? ExpiryTime { get; set; }
    public bool Success { get; set; }
}
