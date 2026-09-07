using SPS.Domain.Common;

namespace SPS.Domain.Entities;

/// <summary>
/// 網站計數器
/// </summary>
public class SiteCounter : BaseEntity<int>
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
