using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Application;

/// <summary>
/// 申請詳情響應
/// </summary>
public class ApplicationResponse
{
    public Guid Id { get; set; }
    public string ApplicationNumber { get; set; } = string.Empty;
    public ApplicantType ApplicantType { get; set; }
    public Guid? ExistingMemberId { get; set; }
    public MemberRole MemberRole { get; set; }
    public CompanyLevel? SupplierTier { get; set; }
    public ApplicationStatus Status { get; set; }

    /// <summary>
    /// 新興會員委員評分警示（非阻斷性）——只有新興會員申請、評分未達門檻
    /// 時才會有值，審核員仍可自行決定是否核准
    /// </summary>
    public string? ScoringWarning { get; set; }

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
    public string? Industry { get; set; }
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
