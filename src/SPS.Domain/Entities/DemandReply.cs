using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 需求回應：供應端企業會員對媒合對接某一筆需求提出的回應。送出後是待審，後台審核通過才會寄信給
/// 刊登者與當下所有追蹤者；退回則寄信通知供應業者。同一家供應業者對同一需求可以回應多次（不設上限）。
/// </summary>
public class DemandReply : BaseEntity<int>
{
    public int DemandId { get; set; }
    public Demand Demand { get; set; } = null!;

    /// <summary>送出的供應端會員</summary>
    public Guid MemberId { get; set; }

    /// <summary>送出當下會員所屬的公司名稱（後台審核與寄信用，不用再查）</summary>
    public string? CompanyName { get; set; }

    public string ContactName { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string? ContactPhone { get; set; }

    /// <summary>回應內容（純文字）</summary>
    public string Content { get; set; } = string.Empty;

    public DemandReplyStatus Status { get; set; } = DemandReplyStatus.Pending;

    /// <summary>退回原因（只有退回時有值，會寄給供應業者）</summary>
    public string? RejectReason { get; set; }

    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }

    /// <summary>通過後實際寄出的收件人數（刊登者加追蹤者）；還沒寄或寄信功能停用時為空</summary>
    public int? SentCount { get; set; }
    public DateTime? SentAt { get; set; }
}
