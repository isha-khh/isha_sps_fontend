using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 公司實體
/// 代表系統中的企業或組織資訊
/// </summary>
public class Company : BaseEntity<Guid>
{
    /// <summary>
    /// 資料模式
    /// </summary>
    public DataMode DataMode { get; set; }

    /// <summary>
    /// 公司編號
    /// </summary>
    public string Number { get; set; } = string.Empty;

    /// <summary>
    /// 公司名稱
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 公司英文名稱
    /// </summary>
    public string? EnglishName { get; set; }

    /// <summary>
    /// 地址 ID
    /// </summary>
    public int? AddressId { get; set; }

    /// <summary>
    /// 公司電話
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// 公司傳真
    /// </summary>
    public string? Fax { get; set; }

    /// <summary>
    /// 公司照片/Logo ID
    /// </summary>
    public int? PhotoId { get; set; }

    /// <summary>
    /// 營收
    /// </summary>
    public decimal? Revenue { get; set; }

    /// <summary>
    /// 員工人數
    /// </summary>
    public int? Employees { get; set; }

    /// <summary>
    /// 主要業務/主旨
    /// </summary>
    public string? Subject { get; set; }

    /// <summary>
    /// 公司簡介
    /// </summary>
    public string? Introduction { get; set; }

    /// <summary>
    /// 備註
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 狀態
    /// </summary>
    public Status Status { get; set; }

    /// <summary>
    /// 稅號
    /// </summary>
    public string? Tax { get; set; }

    /// <summary>
    /// 聯絡人 Email
    /// </summary>
    public string? ChargeEmail { get; set; }

    /// <summary>
    /// 聯絡人分機
    /// </summary>
    public string? ChargeExt { get; set; }

    /// <summary>
    /// 聯絡人職稱
    /// </summary>
    public string? ChargeJobTitle { get; set; }

    /// <summary>
    /// 聯絡人手機
    /// </summary>
    public string? ChargeMobile { get; set; }

    /// <summary>
    /// 聯絡人電話
    /// </summary>
    public string? ChargePhone { get; set; }

    /// <summary>
    /// 成立日期
    /// </summary>
    public string? EstablishmentDate { get; set; }

    /// <summary>
    /// 英文簡介
    /// </summary>
    public string? IntroductionEnglish { get; set; }

    /// <summary>
    /// 官方網站網址
    /// </summary>
    public string? OrgUrl { get; set; }

    /// <summary>
    /// 影片網址
    /// </summary>
    public string? VideoUrl { get; set; }

    /// <summary>
    /// 負責人/聯絡人姓名
    /// </summary>
    public string? Charge { get; set; }

    /// <summary>
    /// 公司類型
    /// </summary>
    public CompanyType Type { get; set; }

    /// <summary>
    /// Banner 圖片 ID
    /// </summary>
    public int? BannerId { get; set; }

    /// <summary>
    /// 公司等級
    /// </summary>
    public CompanyLevel Level { get; set; }

    /// <summary>
    /// 排序
    /// </summary>
    public int Ordinal { get; set; }

    // ==================== 企業認證相關 ====================

    /// <summary>
    /// 統一社會信用代碼（唯一標識）
    /// </summary>
    public string UnifiedSocialCreditCode { get; set; } = string.Empty;

    /// <summary>
    /// 是否已通過API驗證
    /// </summary>
    public bool IsVerified { get; set; }

    /// <summary>
    /// 驗證時間
    /// </summary>
    public DateTime? VerifiedAt { get; set; }

    /// <summary>
    /// 負責人姓名
    /// </summary>
    public string? ContactPerson { get; set; }

    /// <summary>
    /// 會員類別（Supplier/Buyer）
    /// </summary>
    public MemberRole? MemberRole { get; set; }

    // Navigation properties
    
    /// <summary>
    /// 地址關聯
    /// </summary>
    public Address? Address { get; set; }

    /// <summary>
    /// 照片/Logo 關聯
    /// </summary>
    public Picture? Photo { get; set; }

    /// <summary>
    /// Banner 圖片關聯
    /// </summary>
    public Picture? Banner { get; set; }

    /// <summary>
    /// 成員列表
    /// </summary>
    public ICollection<Member> Members { get; set; } = new List<Member>();

    /// <summary>
    /// 申請紀錄
    /// </summary>
    public ICollection<MemberApplication> Applications { get; set; } = new List<MemberApplication>();

    /// <summary>
    /// 產品列表
    /// </summary>
    public ICollection<Product> Products { get; set; } = new List<Product>();

    /// <summary>
    /// 需求列表
    /// </summary>
    public ICollection<Demand> Demands { get; set; } = new List<Demand>();

    /// <summary>
    /// 會員收藏列表
    /// </summary>
    public ICollection<MemberFavorite> MemberFavorites { get; set; } = new List<MemberFavorite>();

    /// <summary>
    /// 發起的聊天記錄
    /// </summary>
    public ICollection<ChatRecord> InitiatedChats { get; set; } = new List<ChatRecord>();

    /// <summary>
    /// 接收的聊天記錄
    /// </summary>
    public ICollection<ChatRecord> ReceivedChats { get; set; } = new List<ChatRecord>();

    /// <summary>
    /// 檔案列表
    /// </summary>
    public ICollection<File> Files { get; set; } = new List<File>();

    /// <summary>
    /// 文件列表
    /// </summary>
    public ICollection<Document> Documents { get; set; } = new List<Document>();

    /// <summary>
    /// 評分紀錄
    /// </summary>
    public ICollection<Scoring> Scorings { get; set; } = new List<Scoring>();
}