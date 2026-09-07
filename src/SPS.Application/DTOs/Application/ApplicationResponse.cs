using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Application;

/// <summary>
/// 申請詳情響應
/// </summary>
public class ApplicationResponse
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
    public string? Position { get; set; }

    // 企業信息
    public Guid? CompanyId { get; set; }
    public string UnifiedSocialCreditCode { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? ContactPerson { get; set; }
    public bool IsManualInput { get; set; }
    public string? BusinessScope { get; set; }
    public string? CompanyAddress { get; set; }

    // 申請說明
    public string? Reason { get; set; }
    public string? Remark { get; set; }

    // 審核信息
    public Guid? ReviewerId { get; set; }
    public string? ReviewerName { get; set; }
    public DateTime? ReviewStartedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewComment { get; set; }
    public string? RejectionReason { get; set; }

    // 時間信息
    public DateTime? SubmittedAt { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime? UpdatedTime { get; set; }

    // 關聯數據
    public List<ApplicationMemberResponse> Members { get; set; } = new();
    public List<DocumentResponse> Documents { get; set; } = new();
    public List<ApplicationLogResponse> Logs { get; set; } = new();
}
