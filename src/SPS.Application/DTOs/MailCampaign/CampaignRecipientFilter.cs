namespace SPS.Application.DTOs.MailCampaign;

/// <summary>
/// 群發收件人篩選條件（在 CompanyIds / MemberIds 解析後，再用此條件縮窄）
/// </summary>
public class CampaignRecipientFilter
{
    /// <summary>公司類型（多選；對應 CompanyType enum 數值）</summary>
    public List<short>? CompanyTypes { get; set; }

    /// <summary>公司級別（多選；對應 CompanyLevel enum 數值）</summary>
    public List<short>? CompanyLevels { get; set; }

    /// <summary>公司 Tag（多選；EntityTag 上的 TagId）</summary>
    public List<int>? CompanyTagIds { get; set; }

    /// <summary>會員狀態（Active=1，Inactive=0）。未指定時預設 Active</summary>
    public short? MemberStatus { get; set; }

    /// <summary>會員資料模式（DataMode enum 數值）</summary>
    public short? MemberDataMode { get; set; }
}
