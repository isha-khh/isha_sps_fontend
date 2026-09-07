namespace SPS.Domain.Enums;

/// <summary>
/// 郵件活動狀態
/// </summary>
public enum EmailCampaignStatus
{
    /// <summary>草稿（尚未送出）</summary>
    Draft = 0,

    /// <summary>已排入佇列，待寄送</summary>
    Queued = 1,

    /// <summary>寄送中</summary>
    Sending = 2,

    /// <summary>全部寄送完成（不論成功或失敗都已嘗試）</summary>
    Completed = 3,

    /// <summary>整體寄送失敗（系統錯誤；個別收件失敗不在此狀態）</summary>
    Failed = 4,

    /// <summary>已取消</summary>
    Cancelled = 5
}
