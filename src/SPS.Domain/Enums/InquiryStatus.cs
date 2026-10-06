namespace SPS.Domain.Enums;

/// <summary>詢問單處理狀態</summary>
public enum InquiryStatus : short
{
    /// <summary>新進，還沒人處理</summary>
    New = 0,

    /// <summary>處理中</summary>
    InProgress = 1,

    /// <summary>已結案</summary>
    Closed = 2,
}
