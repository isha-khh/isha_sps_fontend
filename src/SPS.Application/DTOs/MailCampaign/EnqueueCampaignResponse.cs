namespace SPS.Application.DTOs.MailCampaign;

/// <summary>
/// 排入佇列的回應（同步部分結束，實際寄送由背景 worker 處理）
/// </summary>
public class EnqueueCampaignResponse
{
    public Guid CampaignId { get; set; }

    /// <summary>解析後的總收件人數（已寫入快照／Recipient 表）</summary>
    public int TotalRecipients { get; set; }

    /// <summary>實際生效的排程時間（若未指定則為當下）</summary>
    public DateTime ScheduledFor { get; set; }

    public int Status { get; set; }
}
