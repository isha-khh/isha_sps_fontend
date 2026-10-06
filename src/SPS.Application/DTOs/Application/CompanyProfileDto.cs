using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Application;

/// <summary>
/// 申請時填寫的公司專頁資料（公司電話、地址的縣市／鄉鎮區、成立日期、資本額、網址、簡介、主要產品、標籤、獲獎事蹟、工廠）。
/// 審核通過時帶進公司資料（見 <c>ApplicationReviewService</c>），前台企業名錄才有東西可以顯示。
/// 公司地址的「詳細地址」沿用原有的 <c>CompanyAddress</c> 欄位。
/// </summary>
public class CompanyProfileDto
{
    [MaxLength(50)] public string? Phone { get; set; }

    /// <summary>公司地址的縣市（例如「高雄市」）</summary>
    [MaxLength(20)] public string? City { get; set; }

    /// <summary>公司地址的鄉鎮市區（例如「前鎮區」）</summary>
    [MaxLength(20)] public string? District { get; set; }

    /// <summary>公司地址的 3 碼郵遞區號</summary>
    [MaxLength(5)] public string? PostalCode { get; set; }

    /// <summary>成立日期（yyyy-MM-dd）</summary>
    [MaxLength(10)] public string? EstablishmentDate { get; set; }

    [Range(0, 999999999999)] public decimal? Revenue { get; set; }

    [MaxLength(500)] public string? OrgUrl { get; set; }

    [MaxLength(2000)] public string? Introduction { get; set; }

    /// <summary>主要產品暨服務</summary>
    [MaxLength(500)] public string? Subject { get; set; }

    /// <summary>獲獎事蹟暨重要合作案例</summary>
    [MaxLength(2000)] public string? AwardNote { get; set; }

    /// <summary>勾選的企業標籤（應用情境／應用範疇／智慧技術，後台「分類管理」的企業標籤 id）</summary>
    public List<int> TagIds { get; set; } = new();

    // 需求端的工廠資料
    [MaxLength(200)] public string? FactoryName { get; set; }
    [MaxLength(20)] public string? FactoryCity { get; set; }
    [MaxLength(20)] public string? FactoryDistrict { get; set; }
    [MaxLength(5)] public string? FactoryPostalCode { get; set; }
    [MaxLength(300)] public string? FactoryAddress { get; set; }
}
