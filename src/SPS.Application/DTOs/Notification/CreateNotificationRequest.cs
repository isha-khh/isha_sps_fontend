using System.ComponentModel.DataAnnotations;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Notification;

public class CreateNotificationRequest
{
    [Required]
    public NotificationType Type { get; set; }

    [StringLength(100)]
    public string? Category { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(2000)]
    public string Content { get; set; } = string.Empty;

    [StringLength(100)]
    public string? SendId { get; set; }

    [Required]
    [StringLength(100)]
    public string Recipient { get; set; } = string.Empty;

    public DateTime? Expiration { get; set; }
}