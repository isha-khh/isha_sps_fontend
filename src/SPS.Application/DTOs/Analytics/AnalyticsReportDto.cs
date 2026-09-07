using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Analytics;

public class AnalyticsReportDto
{
    public List<AnalyticsDailyMetricDto> DailyMetrics { get; set; } = new();
    public List<DimensionStatisticDto> Distributions { get; set; } = new();
}

public class DimensionStatisticDto
{
    public AnalyticsDimensionType DimensionType { get; set; }
    public string DimensionValue { get; set; } = string.Empty;
    public int TotalUsers { get; set; }
}
