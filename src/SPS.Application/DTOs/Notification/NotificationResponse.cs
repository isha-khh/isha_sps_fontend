using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Notification;

public class NotificationResponse
{
    public long Id { get; set; }
    public NotificationType Type { get; set; }
    public string? Category { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public string? SendId { get; set; }
    public string? Recipient { get; set; }
    public bool Read { get; set; }
    public DateTime? Expiration { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime UpdatedTime { get; set; }
}