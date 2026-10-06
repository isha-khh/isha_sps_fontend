using System.ComponentModel.DataAnnotations;
using SPS.Application.DTOs.Common;

namespace SPS.Application.DTOs.Member;

/// <summary>
/// 企業會員在會員中心修改自己公司資料的請求。刻意和後台用的 <c>UpdateCompanyRequest</c> 分開：
/// 公司名稱、統一編號、類型、等級、狀態、審核狀態與內部備註只有後台可以改，會員端不能送。
/// 所有欄位「沒帶（null）= 不更新」；字串欄位送空字串 = 清除。
/// </summary>
public class MemberUpdateCompanyRequest
{
    [MaxLength(200)] public string? EnglishName { get; set; }
    [MaxLength(50)] public string? Phone { get; set; }
    [MaxLength(50)] public string? Fax { get; set; }
    [Range(0, 999999999999)] public decimal? Revenue { get; set; }
    [Range(0, 10000000)] public int? Employees { get; set; }
    [MaxLength(500)] public string? Subject { get; set; }
    [MaxLength(2000)] public string? Introduction { get; set; }
    [MaxLength(4000)] public string? IntroductionEnglish { get; set; }
    [MaxLength(500)] public string? OrgUrl { get; set; }
    [MaxLength(500)] public string? VideoUrl { get; set; }
    [MaxLength(10)] public string? EstablishmentDate { get; set; }

    [MaxLength(100)] public string? Charge { get; set; }
    [MaxLength(200)] public string? ChargeEmail { get; set; }
    [MaxLength(50)] public string? ChargePhone { get; set; }
    [MaxLength(50)] public string? ChargeMobile { get; set; }
    [MaxLength(100)] public string? ChargeJobTitle { get; set; }

    /// <summary>公司地址（整份取代）</summary>
    public AddressDto? Address { get; set; }

    /// <summary>合作案例說明（前台企業詳情「獲獎事蹟暨重要合作案例」）</summary>
    [MaxLength(2000)] public string? CooperationNote { get; set; }

    /// <summary>工廠名稱／地址（需求端）</summary>
    [MaxLength(200)] public string? FactoryName { get; set; }
    [MaxLength(300)] public string? FactoryAddress { get; set; }

    /// <summary>主要產品暨服務示意圖、獲獎事蹟圖片的檔案 Id（先用 <c>POST api/member/company/images</c> 上傳取得，最多 12 張）</summary>
    public List<Guid>? ProductImageFileIds { get; set; }
    public List<Guid>? AwardImageFileIds { get; set; }

    /// <summary>公司 LOGO：上傳後的圖片檔案 Id；<see cref="RemoveLogo"/> = true 清除</summary>
    public Guid? LogoFileId { get; set; }
    public bool RemoveLogo { get; set; }
}
