namespace SPS.Application.DTOs.Demand;

/// <summary>
/// 需求統計數據 DTO
/// </summary>
public class DemandStatisticsDto
{
    /// <summary>
    /// 總需求數
    /// </summary>
    public int TotalDemands { get; set; }

    /// <summary>
    /// 已發布需求數
    /// </summary>
    public int PublishedDemands { get; set; }

    /// <summary>
    /// 草稿需求數
    /// </summary>
    public int DraftDemands { get; set; }

    /// <summary>
    /// 本月新增需求數
    /// </summary>
    public int DemandsThisMonth { get; set; }

    /// <summary>
    /// 本週新增需求數
    /// </summary>
    public int DemandsThisWeek { get; set; }

    /// <summary>
    /// 按公司類型分組（可選）
    /// </summary>
    public CompanyTypeBreakdown? ByCompanyType { get; set; }
}

/// <summary>
/// 按公司類型分組統計
/// </summary>
public class CompanyTypeBreakdown
{
    /// <summary>
    /// 供給端公司需求數
    /// </summary>
    public int Supplier { get; set; }

    /// <summary>
    /// 需求端公司需求數
    /// </summary>
    public int Buyer { get; set; }

    /// <summary>
    /// 供需雙方公司需求數
    /// </summary>
    public int Both { get; set; }
}
