namespace SPS.Domain.Enums;

/// <summary>需求回應的審核狀態：供應業者送出後是待審，後台通過才會寄給刊登者與追蹤者</summary>
public enum DemandReplyStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}
