using SPS.Domain.Common;

namespace SPS.Domain.Entities;

/// <summary>
/// Google Analytics 每日數據匯總
/// </summary>
public class AnalyticsDailyMetric : BaseEntity<int>
{
    /// <summary>
    /// 數據日期
    /// </summary>
    public DateOnly Date { get; set; }

    /// <summary>
    /// 活躍使用者 (Active Users)
    /// </summary>
    public int ActiveUsers { get; set; }

    /// <summary>
    /// 新使用者 (New Users)
    /// </summary>
    public int NewUsers { get; set; }

    /// <summary>
    /// 頁面瀏覽量 (Screen Page Views)
    /// </summary>
    public int ScreenPageViews { get; set; }

    /// <summary>
    /// 工作階段 (Sessions)
    /// </summary>
    public int Sessions { get; set; }
    
    /// <summary>
    /// 平均參與時間 (秒) (Average Engagement Time)
    /// </summary>
    public double AverageEngagementTime { get; set; }

    /// <summary>
    /// 跳出率 (Bounce Rate) (0-1)
    /// </summary>
    public double BounceRate { get; set; }

    /// <summary>
    /// 平均瀏覽頁數 (Screen Page Views Per Session)
    /// </summary>
    public double ScreenPageViewsPerSession { get; set; }

    /// <summary>
    /// 事件總數 (Event Count)
    /// </summary>
    public int EventCount { get; set; }
}
