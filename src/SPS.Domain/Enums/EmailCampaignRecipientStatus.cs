namespace SPS.Domain.Enums;

/// <summary>
/// 群發郵件單筆收件狀態
/// </summary>
public enum EmailCampaignRecipientStatus
{
    /// <summary>尚未寄送</summary>
    Pending = 0,

    /// <summary>已成功寄出</summary>
    Sent = 1,

    /// <summary>寄送失敗（SMTP 層）</summary>
    Failed = 2,

    /// <summary>已退信（由 BounceProcessing 更新）</summary>
    Bounced = 3
}
