using SPS.Application.DTOs.Common;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Notification;

public class NotificationQueryParameters : QueryParameters
{
    public NotificationType? Type { get; set; }
    public string? Recipient { get; set; }
    public bool? Read { get; set; }
}