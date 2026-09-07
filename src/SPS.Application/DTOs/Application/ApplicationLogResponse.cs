using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Application;

/// <summary>
/// 申請日志響應
/// </summary>
public class ApplicationLogResponse
{
    public Guid Id { get; set; }
    public ApplicationStatus? FromStatus { get; set; }
    public ApplicationStatus? ToStatus { get; set; }
    public Guid? OperatorId { get; set; }
    public string? OperatorName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public string? IpAddress { get; set; }
    public DateTime OperatedAt { get; set; }
}
