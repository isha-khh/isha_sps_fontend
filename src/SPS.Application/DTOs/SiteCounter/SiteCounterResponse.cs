namespace SPS.Application.DTOs.SiteCounter;

/// <summary>
/// 網站計數器響應
/// </summary>
public class SiteCounterResponse
{
    /// <summary>
    /// 總訪客數（UV）
    /// </summary>
    public long TotalVisitors { get; set; }

    /// <summary>
    /// 總瀏覽量（PV）
    /// </summary>
    public long TotalPageViews { get; set; }
}
