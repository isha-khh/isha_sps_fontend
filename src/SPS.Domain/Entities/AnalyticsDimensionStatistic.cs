using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 網站分析維度統計 (用於圓餅圖/分佈圖)
/// </summary>
public class AnalyticsDimensionStatistic : BaseEntity<int>
{
    /// <summary>
    /// 日期
    /// </summary>
    public DateOnly Date { get; set; }

    /// <summary>
    /// 維度類型 (裝置/瀏覽器/國家/語言)
    /// </summary>
    public AnalyticsDimensionType DimensionType { get; set; }

    /// <summary>
    /// 維度值 (例如 "Mobile", "Chrome", "Taiwan")
    /// </summary>
    public string DimensionValue { get; set; } = string.Empty;

    /// <summary>
    /// 統計數值 (通常是使用者人數)
    /// </summary>
    public int MetricValue { get; set; }
}
