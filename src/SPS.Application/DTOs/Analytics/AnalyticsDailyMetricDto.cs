namespace SPS.Application.DTOs.Analytics;

public class AnalyticsDailyMetricDto
{
    public DateOnly Date { get; set; }
    public int ActiveUsers { get; set; }
    public int NewUsers { get; set; }
    public int ScreenPageViews { get; set; }
    public int Sessions { get; set; }
    public double AverageEngagementTime { get; set; }
    public double BounceRate { get; set; }
    public double ScreenPageViewsPerSession { get; set; }
    public int EventCount { get; set; }
}
