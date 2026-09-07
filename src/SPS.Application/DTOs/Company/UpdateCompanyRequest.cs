using SPS.Application.DTOs.Common;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Company;

/// <summary>
/// 更新企業請求
/// </summary>
public class UpdateCompanyRequest
{
    /// <summary>
    /// 企業名稱
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 英文名稱
    /// </summary>
    public string? EnglishName { get; set; }

    /// <summary>
    /// 聯系電話
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// 傳真
    /// </summary>
    public string? Fax { get; set; }

    /// <summary>
    /// 企業類型
    /// </summary>
    public CompanyType? Type { get; set; }

    /// <summary>
    /// 企業級別
    /// </summary>
    public CompanyLevel? Level { get; set; }

    /// <summary>
    /// 年營收
    /// </summary>
    public decimal? Revenue { get; set; }

    /// <summary>
    /// 員工數
    /// </summary>
    public int? Employees { get; set; }

    /// <summary>
    /// 主營業務
    /// </summary>
    public string? Subject { get; set; }

    /// <summary>
    /// 企業簡介
    /// </summary>
    public string? Introduction { get; set; }

    /// <summary>
    /// 英文簡介
    /// </summary>
    public string? IntroductionEnglish { get; set; }

    /// <summary>
    /// 企業網址
    /// </summary>
    public string? OrgUrl { get; set; }

    /// <summary>
    /// 影片網址
    /// </summary>
    public string? VideoUrl { get; set; }

    /// <summary>
    /// 負責人
    /// </summary>
    public string? Charge { get; set; }

    /// <summary>
    /// 負責人郵箱
    /// </summary>
    public string? ChargeEmail { get; set; }

    /// <summary>
    /// 負責人電話
    /// </summary>
    public string? ChargePhone { get; set; }

    /// <summary>
    /// 負責人手機
    /// </summary>
    public string? ChargeMobile { get; set; }

    /// <summary>
    /// 負責人職位
    /// </summary>
    public string? ChargeJobTitle { get; set; }

    /// <summary>
    /// 成立日期
    /// </summary>
    public string? EstablishmentDate { get; set; }

    /// <summary>
    /// 備註
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 狀態
    /// </summary>
    public Status? Status { get; set; }

    /// <summary>
    /// 地址信息
    /// </summary>
    public AddressDto? Address { get; set; }

    /// <summary>
    /// 照片/Logo ID
    /// </summary>
    public int? PhotoId { get; set; }

    /// <summary>
    /// 是否移除照片/Logo
    /// </summary>
    public bool RemovePhoto { get; set; } =false;

    /// <summary>
    /// Banner 圖片 ID
    /// </summary>
    public int? BannerId { get; set; }

    /// <summary>
    /// 是否移除 Banner 圖片
    /// </summary>
    public bool RemoveBanner { get; set; }  =false;
}
