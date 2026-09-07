using System.ComponentModel.DataAnnotations;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Member;

/// <summary>
/// 新增公司成員請求
/// </summary>
public class CreateCompanyMemberRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string? Nickname { get; set; }
    public string? Phone { get; set; }
    public string? Extension { get; set; }
    public string? MobilePhone { get; set; }
    public string? Position { get; set; }
    public string? MemberJobTitle { get; set; }
    public MemberPosition MemberPosition { get; set; } = MemberPosition.Employee;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    public bool IsDesignatedContact { get; set; }
}
