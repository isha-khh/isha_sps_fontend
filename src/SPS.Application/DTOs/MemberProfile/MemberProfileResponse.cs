using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Member;

/// <summary>
/// 會員個人資料響應
/// </summary>
public class MemberProfileResponse
{
    public Guid Id { get; set; }
    public string? Number { get; set; }
    public string? Nickname { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Extension { get; set; }
    public string? MobilePhone { get; set; }
    public Guid? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public string? Position { get; set; }
    public string? MemberJobTitle { get; set; }
    public MemberRole Role { get; set; }
    public MemberPosition MemberPosition { get; set; }
    public MemberPermission Permissions { get; set; }
    public int? PhotoId { get; set; }
    public string? PhotoUrl { get; set; }

    /// <summary>
    /// 是否已驗證信箱
    /// </summary>
    public bool IsEmailVerified { get; set; }

    /// <summary>
    /// 信箱驗證時間
    /// </summary>
    public DateTime? EmailVerifiedAt { get; set; }

    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
