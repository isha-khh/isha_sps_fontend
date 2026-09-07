using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 群發活動底下的單筆收件人（每人一封、可帶變數）
/// </summary>
public class EmailCampaignRecipient : BaseEntity<Guid>
{
    public Guid CampaignId { get; set; }

    public Guid? MemberId { get; set; }

    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 變數 JSON：{"Name":"...","CompanyName":"...",...}
    /// </summary>
    public string? Variables { get; set; }

    /// <summary>
    /// 寄出後對應的 MailLog ID
    /// </summary>
    public int? MailLogId { get; set; }

    public EmailCampaignRecipientStatus Status { get; set; } = EmailCampaignRecipientStatus.Pending;

    public string? ErrorMessage { get; set; }
}
