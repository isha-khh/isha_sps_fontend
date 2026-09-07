namespace SPS.Application.DTOs.News;

/// <summary>
/// 新聞統計數據 DTO
/// </summary>
public class NewsStatisticsDto
{
    /// <summary>
    /// 總新聞數
    /// </summary>
    public int TotalNews { get; set; }

    /// <summary>
    /// 已發布新聞數
    /// </summary>
    public int Published { get; set; }

    /// <summary>
    /// 草稿新聞數
    /// </summary>
    public int Draft { get; set; }

    /// <summary>
    /// 排程新聞數
    /// </summary>
    public int Scheduled { get; set; }

    /// <summary>
    /// 今日發布數
    /// </summary>
    public int TodayPublished { get; set; }

    /// <summary>
    /// 本月發布數
    /// </summary>
    public int ThisMonthPublished { get; set; }

    /// <summary>
    /// 總瀏覽次數（如果有追蹤功能）
    /// </summary>
    public int TotalViews { get; set; }
}
