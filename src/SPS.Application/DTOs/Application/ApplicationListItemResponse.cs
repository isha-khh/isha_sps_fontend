using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Application;

/// <summary>
/// 申請列表項響應
/// </summary>
public class ApplicationListItemResponse
{
    public Guid Id { get; set; }
    public string ApplicationNumber { get; set; } = string.Empty;
    public MemberRole MemberRole { get; set; }
    public ApplicationStatus Status { get; set; }

    // 申請人信息
    public string Email { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Extension { get; set; }
    public string? MobilePhone { get; set; }

    // 企業信息
    public string UnifiedSocialCreditCode { get; set; } = string.Empty;
    public string? CompanyName { get; set; }

    // 審核信息
    public Guid? ReviewerId { get; set; }
    public string? ReviewerName { get; set; }
    public DateTime? ReviewStartedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }

    // 時間信息
    public DateTime? SubmittedAt { get; set; }
    public DateTime CreatedTime { get; set; }
}
