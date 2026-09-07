using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 群發郵件活動：一次寄信任務（可能對應到多封 MailLog）
/// </summary>
public class EmailCampaign : BaseEntity<Guid>
{
    public string Subject { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// 收件範圍快照（JSON）：來源模式、companyIds、memberIds、過濾條件，留作稽核
    /// </summary>
    public string? RecipientSnapshot { get; set; }

    public EmailCampaignStatus Status { get; set; } = EmailCampaignStatus.Draft;

    /// <summary>
    /// 寄送模式（0=BCC, 1=PerRecipient），由 worker 在取出時依此決定處理方式
    /// </summary>
    public int SendMode { get; set; }

    /// <summary>
    /// 預定寄送時間（null = 立即；worker 撈 ScheduleAt &lt;= 現在的 Queued）
    /// </summary>
    public DateTime? ScheduleAt { get; set; }

    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }

    /// <summary>
    /// 建立者（後台帳號 ID）
    /// </summary>
    public string? CreatedBy { get; set; }

    public DateTime? StartedTime { get; set; }
    public DateTime? CompletedTime { get; set; }

    public string? ErrorMessage { get; set; }

    /// <summary>
    /// 是否套用系統郵件版面配置（layout / 範本外框）。預設 true
    /// </summary>
    public bool ApplyLayout { get; set; } = true;

    public ICollection<EmailCampaignAttachment> Attachments { get; set; } = new List<EmailCampaignAttachment>();
}
