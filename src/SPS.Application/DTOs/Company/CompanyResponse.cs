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
    public string? CooperationNote { get; set; }

    /// <summary>圖片的檔案 Id（原始設定；控制器會依檔案是否可用解析成 <see cref="ProductImages"/>／<see cref="AwardImages"/>）</summary>
    public List<Guid> ProductImageFileIds { get; set; } = new();
    public List<Guid> AwardImageFileIds { get; set; } = new();

    /// <summary>主要產品暨服務示意圖（只有詳情會解析；檔案不存在或不是圖片就略過）</summary>
    public List<CompanyImageDto> ProductImages { get; set; } = new();

    /// <summary>獲獎事蹟暨重要合作案例圖片</summary>
    public List<CompanyImageDto> AwardImages { get; set; } = new();
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

/// <summary>企業詳情的圖片（來自檔案管理）</summary>
public class CompanyImageDto
{
    public Guid FileId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}
