using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 申請成員表 - 記錄申請中的多個成員信息
/// </summary>
public class ApplicationMember : BaseEntity<Guid>
{
    /// <summary>
    /// 關聯申請ID
    /// </summary>
    public Guid ApplicationId { get; set; }

    /// <summary>
    /// 申請人姓名（必填）
    /// </summary>
    public string ContactName { get; set; } = string.Empty;

    /// <summary>
    /// 申請人職稱（必填）
    /// </summary>
    public string Position { get; set; } = string.Empty;

    /// <summary>
    /// 申請人Email（必填）
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 聯絡電話（必填）
    /// </summary>
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// 分機（選填）
    /// </summary>
    public string? Extension { get; set; }

    /// <summary>
    /// 手機電話（選填）
    /// </summary>
    public string? MobilePhone { get; set; }

    /// <summary>
    /// 密碼哈希（必填）
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// 會員職位（Manager/Employee）
    /// </summary>
    public MemberPosition MemberPosition { get; set; }

    /// <summary>
    /// 排序序號（第一個為0，用於標識主要聯絡人）
    /// </summary>
    public int OrderIndex { get; set; }

    /// <summary>
    /// 狀態（Active/Inactive）
    /// </summary>
    public Status Status { get; set; }

    /// <summary>
    /// 審核通過後創建的Member ID
    /// </summary>
    public Guid? CreatedMemberId { get; set; }

    // ==================== 導航屬性 ====================

    /// <summary>
    /// 關聯申請
    /// </summary>
    public MemberApplication Application { get; set; } = null!;

    /// <summary>
    /// 關聯會員（如果已創建）
    /// </summary>
    public Member? CreatedMember { get; set; }
}
