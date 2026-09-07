using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Member;

/// <summary>
/// 更新會員請求
/// </summary>
public class UpdateMemberRequest
{
    /// <summary>
    /// 會員暱稱/姓名
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 電話
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// 分機
    /// </summary>
    public string? Extension { get; set; }

    /// <summary>
    /// 手機號碼
    /// </summary>
    public string? MobilePhone { get; set; }

    /// <summary>
    /// 狀態
    /// </summary>
    public Status? Status { get; set; }

    /// <summary>
    /// 會員角色（經理/員工）
    /// </summary>
    public MemberPosition? MemberPosition { get; set; }

    /// <summary>
    /// 備註
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 職稱
    /// </summary>
    public string? MemberJobTitle { get; set; }

    /// <summary>
    /// 職位
    /// </summary>
    public string? Position { get; set; }

    /// <summary>
    /// 是否需要首次登入修改密碼
    /// </summary>
    public bool? RequirePasswordChange { get; set; }
}

/// <summary>
/// 管理員重置會員密碼請求
/// </summary>
public class AdminResetMemberPasswordRequest
{
    /// <summary>
    /// 新密碼（可選，若不提供則自動生成）
    /// </summary>
    public string? NewPassword { get; set; }

    /// <summary>
    /// 是否要求會員下次登入時修改密碼
    /// </summary>
    public bool RequireChangeOnLogin { get; set; } = true;

    /// <summary>
    /// 是否發送通知郵件給會員
    /// </summary>
    public bool SendNotificationEmail { get; set; } = true;
}
