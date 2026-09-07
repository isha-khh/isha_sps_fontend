using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Member;

/// <summary>
/// 會員列表項響應
/// </summary>
public class MemberListItemResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Extension { get; set; }
    public string? MobilePhone { get; set; }
    public string? Position { get; set; }
    public string? MemberJobTitle { get; set; }
    public Guid? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public Status Status { get; set; }
    public MemberRole Role { get; set; }
    public MemberPosition MemberPosition { get; set; }
    public bool IsApproved { get; set; }

    /// <summary>
    /// 是否已驗證信箱
    /// </summary>
    public bool IsEmailVerified { get; set; }

    public bool IsDesignatedContact { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
