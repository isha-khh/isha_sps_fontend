using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Member;

/// <summary>
/// 會員詳情響應
/// </summary>
public class MemberResponse
{
    public Guid Id { get; set; }
    public string? Number { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Extension { get; set; }
    public string? MobilePhone { get; set; }
    public Guid? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public string? Position { get; set; }
    public string? MemberJobTitle { get; set; }
    public Status Status { get; set; }
    public MemberRole Role { get; set; }
    public MemberPosition MemberPosition { get; set; }
    public bool IsApproved { get; set; }

    /// <summary>
    /// 是否已驗證信箱
    /// </summary>
    public bool IsEmailVerified { get; set; }

    /// <summary>
    /// 信箱驗證時間
    /// </summary>
    public DateTime? EmailVerifiedAt { get; set; }

    public bool IsDesignatedContact { get; set; }
    public string? Remark { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // 密碼相關欄位
    /// <summary>
    /// 是否已完成首次密碼修改
    /// </summary>
    public bool FirstChanged { get; set; }

    /// <summary>
    /// 密碼是否已被修改過
    /// </summary>
    public bool PasswordChanged { get; set; }

    /// <summary>
    /// 密碼最後修改時間
    /// </summary>
    public DateTime? PasswordChangedTime { get; set; }

    /// <summary>
    /// 帳戶鎖定時間
    /// </summary>
    public DateTime? LockedTime { get; set; }

    /// <summary>
    /// 登入失敗次數
    /// </summary>
    public int LoginFailure { get; set; }
}
