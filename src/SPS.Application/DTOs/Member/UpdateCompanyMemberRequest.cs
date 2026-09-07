using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Member;

/// <summary>
/// 更新公司成員請求
/// </summary>
public class UpdateCompanyMemberRequest
{
    public string? Nickname { get; set; }
    public string? Phone { get; set; }
    public string? Extension { get; set; }
    public string? MobilePhone { get; set; }
    public string? Position { get; set; }
    public string? MemberJobTitle { get; set; }
    public Status? Status { get; set; }
    public bool? IsDesignatedContact { get; set; }
}
