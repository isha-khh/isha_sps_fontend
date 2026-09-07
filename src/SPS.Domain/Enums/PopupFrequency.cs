namespace SPS.Domain.Enums;

/// <summary>
/// 彈窗公告顯示頻率
/// </summary>
public enum PopupFrequency
{
    /// <summary>
    /// 每次都彈
    /// </summary>
    Always = 0,

    /// <summary>
    /// 每個 Session 一次
    /// </summary>
    OncePerSession = 1,

    /// <summary>
    /// 每天一次
    /// </summary>
    OncePerDay = 2,

    /// <summary>
    /// 只彈一次（永久記住）
    /// </summary>
    OnceOnly = 3
}
