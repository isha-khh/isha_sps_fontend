using SPS.Domain.Entities;

namespace SPS.Application.DTOs.Demand;

public record DemandNotificationResponse(
    int Id,
    string? CompanyName,
    string RecipientEmail,
    DemandNotificationStatus Status,
    string? ErrorMessage,
    DateTime? SentAt,
    DateTime CreatedTime
);
