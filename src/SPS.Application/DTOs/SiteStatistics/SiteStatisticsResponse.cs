namespace SPS.Application.DTOs.SiteStatistics;

/// <summary>
/// 網站統計數據回應
/// </summary>
public class SiteStatisticsResponse
{
    /// <summary>
    /// 會員總數
    /// </summary>
    public int TotalMembers { get; set; }

    /// <summary>
    /// 媒合成功案例
    /// </summary>
    public int SuccessfulMatches { get; set; }

    /// <summary>
    /// 媒合補助申請案次
    /// </summary>
    public int SubsidyApplications { get; set; }
}

/// <summary>
/// 設定網站統計數據請求
/// </summary>
public class SetSiteStatisticsRequest
{
    /// <summary>
    /// 媒合成功案例
    /// </summary>
    public int? SuccessfulMatches { get; set; }

    /// <summary>
    /// 媒合補助申請案次
    /// </summary>
    public int? SubsidyApplications { get; set; }
}
