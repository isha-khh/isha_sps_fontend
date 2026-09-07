using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Picture;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Company;

/// <summary>
/// 企業響應
/// </summary>
public class CompanyResponse
{
    public Guid Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? EnglishName { get; set; }
    public string UnifiedSocialCreditCode { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Fax { get; set; }
    public CompanyType Type { get; set; }
    public CompanyLevel Level { get; set; }
    public decimal? Revenue { get; set; }
    public int? Employees { get; set; }
    public string? Subject { get; set; }
    public string? Introduction { get; set; }
    public string? IntroductionEnglish { get; set; }
    public string? OrgUrl { get; set; }
    public string? VideoUrl { get; set; }
    public string? Charge { get; set; }
    public string? ChargeEmail { get; set; }
    public string? ChargePhone { get; set; }
    public string? ChargeMobile { get; set; }
    public string? ChargeJobTitle { get; set; }
    public string? EstablishmentDate { get; set; }
    public string? Remark { get; set; }
    public Status Status { get; set; }
    public bool IsVerified { get; set; }
    public DateTime? VerifiedAt { get; set; }
    
    public AddressDto? Address { get; set; }
    public PictureResponse? Photo { get; set; }
    public PictureResponse? Banner { get; set; }
    
    public List<DesignatedContactResponse>? DesignatedContacts { get; set; }

    public DateTime CreatedTime { get; set; }
    public DateTime? UpdatedTime { get; set; }
}
