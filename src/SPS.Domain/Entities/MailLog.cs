using SPS.Domain.Common;

namespace SPS.Domain.Entities;

/// <summary>
/// 郵件發送日誌
/// </summary>
public class MailLog : BaseEntity<int>
{
    /// <summary>
    /// 舊 Mail ID（保留相容）
    /// </summary>
    public int? MailId { get; set; }

    /// <summary>
    /// 發送時間
    /// </summary>
    public DateTime? Time { get; set; }

    /// <summary>
    /// 收件者數量
    /// </summary>
    public int ReceiverCount { get; set; }

    /// <summary>
    /// 收件者（逗號分隔）
    /// </summary>
    public string? Receivers { get; set; }

    /// <summary>
    /// 郵件主旨
    /// </summary>
    public string? Subject { get; set; }

    /// <summary>
    /// 郵件內容（HTML）
    /// </summary>
    public string? Content { get; set; }

    /// <summary>
    /// 郵件類型（PasswordReset, Verification, Notification 等）
    /// </summary>
    public string? MailType { get; set; }

    /// <summary>
    /// 是否發送成功
    /// </summary>
    public bool IsSuccess { get; set; } = true;

    /// <summary>
    /// 錯誤訊息
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// 關聯使用者 ID
    /// </summary>
    public string? RelatedUserId { get; set; }

    /// <summary>
    /// 關聯實體類型
    /// </summary>
    public string? RelatedEntityType { get; set; }

    /// <summary>
    /// 關聯實體 ID
    /// </summary>
    public string? RelatedEntityId { get; set; }

    /// <summary>
    /// 郵件唯一識別碼（Message-ID header）
    /// </summary>
    public string? MessageId { get; set; }

    /// <summary>
    /// 退信狀態：None=無退信, Bounced=已退信, SoftBounce=軟退信
    /// </summary>
    public BounceStatus BounceStatus { get; set; } = BounceStatus.None;

    /// <summary>
    /// 退信原因
    /// </summary>
    public string? BounceReason { get; set; }

    /// <summary>
    /// 退信時間
    /// </summary>
    public DateTime? BounceTime { get; set; }

    /// <summary>
    /// 退信錯誤代碼（如 5.1.1）
    /// </summary>
    public string? BounceCode { get; set; }

    /// <summary>
    /// 遠端 MTA
    /// </summary>
    public string? RemoteMta { get; set; }

    /// <summary>
    /// 對應的群發活動 ID（單筆寄信為 null）
    /// </summary>
    public Guid? CampaignId { get; set; }
}

/// <summary>
/// 退信狀態
/// </summary>
public enum BounceStatus
{
    /// <summary>
    /// 無退信
    /// </summary>
    None = 0,

    /// <summary>
    /// 硬退信（永久失敗，如地址不存在）
    /// </summary>
    HardBounce = 1,

    /// <summary>
    /// 軟退信（暫時失敗，如信箱滿）
    /// </summary>
    SoftBounce = 2
}
