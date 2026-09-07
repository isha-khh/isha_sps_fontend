using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Member;

/// <summary>
/// 會員查詢參數
/// </summary>
public class MemberQueryParameters
{
    public string? Search { get; set; }
    public Status? Status { get; set; }
    public MemberRole? Role { get; set; }
    public Guid? CompanyId { get; set; }
    public bool? IsApproved { get; set; }
    public bool? HasCompany { get; set; }
    public bool? IsEmailVerified { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; }
    public bool Descending { get; set; } = true;
}
