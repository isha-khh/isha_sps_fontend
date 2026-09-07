namespace SPS.Domain.Enums;

/// <summary>
/// MOU 狀態枚舉
/// </summary>
public enum MouStatus
{
    /// <summary>
    /// 草稿
    /// </summary>
    Draft = 0,

    /// <summary>
    /// 生效中
    /// </summary>
    Active = 1,

    /// <summary>
    /// 已過期
    /// </summary>
    Expired = 2,

    /// <summary>
    /// 已終止
    /// </summary>
    Terminated = 3
}
