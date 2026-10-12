namespace SPS.Domain.Enums;

/// <summary>會員收件匣的通知種類</summary>
public enum MemberNotificationType
{
    /// <summary>供應業者的需求回應通過或退回</summary>
    ReplyReviewed = 1,

    /// <summary>需求業者（刊登者與追蹤者）收到審核通過的供應業者回應</summary>
    ReplyReceived = 2,

    /// <summary>新上架的需求符合供應業者的標籤</summary>
    DemandMatched = 3,

    /// <summary>承辦人員對詢問單的回覆</summary>
    InquiryReplied = 4
}
