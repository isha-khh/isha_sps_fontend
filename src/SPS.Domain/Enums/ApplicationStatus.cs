namespace SPS.Domain.Enums;

/// <summary>
/// 申請狀態
/// </summary>
public enum ApplicationStatus
{
    /// <summary>
    /// 草稿 - 未提交
    /// </summary>
    Draft = 0,

    /// <summary>
    /// 待審核 - 已提交等待審核
    /// </summary>
    PendingReview = 1,

    /// <summary>
    /// 審核中 - 已被審核員領取
    /// </summary>
    UnderReview = 2,

    /// <summary>
    /// 已通過 - 審核通過
    /// </summary>
    Approved = 3,

    /// <summary>
    /// 已拒絕 - 審核未通過
    /// </summary>
    Rejected = 4,

    /// <summary>
    /// 已取消 - 用戶取消申請
    /// </summary>
    Cancelled = 6
}
