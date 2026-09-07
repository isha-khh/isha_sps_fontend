using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 會員申請表
/// </summary>
public class MemberApplication : BaseEntity<Guid>
{
    /// <summary>
    /// 申請編號 APP{yyyyMMddHHmmss}
    /// </summary>
    public string ApplicationNumber { get; set; } = string.Empty;

    /// <summary>
    /// 申請角色
    /// </summary>
    public MemberRole MemberRole { get; set; }

    /// <summary>
    /// 申請狀態
    /// </summary>
    public ApplicationStatus Status { get; set; }

    // ==================== 申請人信息 ====================

    /// <summary>
    /// 郵箱
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 密碼哈希（預設密碼）
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// 聯系人姓名
    /// </summary>
    public string ContactName { get; set; } = string.Empty;

    /// <summary>
    /// 電話
    /// </summary>
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// 分機
    /// </summary>
    public string? Extension { get; set; }

    /// <summary>
    /// 手機號碼
    /// </summary>
    public string? MobilePhone { get; set; }

    /// <summary>
    /// 職位
    /// </summary>
    public string? Position { get; set; }

    // ==================== 企業信息 ====================

    /// <summary>
    /// 關聯企業ID（審核通過后創建/關聯）
    /// </summary>
    public Guid? CompanyId { get; set; }

    /// <summary>
    /// 統一編號（必填）
    /// </summary>
    public string UnifiedSocialCreditCode { get; set; } = string.Empty;

    /// <summary>
    /// 企業名稱（API獲取或手動填寫）
    /// </summary>
    public string? CompanyName { get; set; }

    /// <summary>
    /// 負責人姓名（必填）
    /// </summary>
    public string? ContactPerson { get; set; }

    /// <summary>
    /// 是否手動輸入企業信息
    /// </summary>
    public bool IsManualInput { get; set; }

    /// <summary>
    /// 經營范圍
    /// </summary>
    public string? BusinessScope { get; set; }

    /// <summary>
    /// 企業地址
    /// </summary>
    public string? CompanyAddress { get; set; }

    // ==================== 申請說明 ====================

    /// <summary>
    /// 申請理由
    /// </summary>
    public string? Reason { get; set; }

    /// <summary>
    /// 備注
    /// </summary>
    public string? Remark { get; set; }

    // ==================== 審核信息 ====================

    /// <summary>
    /// 審核人ID
    /// </summary>
    public Guid? ReviewerId { get; set; }

    /// <summary>
    /// 開始審核時間
    /// </summary>
    public DateTime? ReviewStartedAt { get; set; }

    /// <summary>
    /// 審核完成時間
    /// </summary>
    public DateTime? ReviewedAt { get; set; }

    /// <summary>
    /// 審核意見
    /// </summary>
    public string? ReviewComment { get; set; }

    /// <summary>
    /// 拒絕原因
    /// </summary>
    public string? RejectionReason { get; set; }

    // ==================== 提交時間 ====================

    /// <summary>
    /// 提交時間
    /// </summary>
    public DateTime? SubmittedAt { get; set; }

    // ==================== 導航屬性 ====================

    /// <summary>
    /// 審核人
    /// </summary>
    public User? Reviewer { get; set; }

    /// <summary>
    /// 關聯企業
    /// </summary>
    public Company? Company { get; set; }

    /// <summary>
    /// 申請的多個成員
    /// </summary>
    public ICollection<ApplicationMember> ApplicationMembers { get; set; } = new List<ApplicationMember>();

    /// <summary>
    /// 申請文件
    /// </summary>
    public ICollection<ApplicationDocument> Documents { get; set; } = new List<ApplicationDocument>();

    /// <summary>
    /// 申請日志
    /// </summary>
    public ICollection<ApplicationLog> Logs { get; set; } = new List<ApplicationLog>();
}
