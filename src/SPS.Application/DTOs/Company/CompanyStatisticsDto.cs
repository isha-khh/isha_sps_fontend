namespace SPS.Application.DTOs.Company;

/// <summary>
/// 公司統計數據 DTO
/// </summary>
public class CompanyStatisticsDto
{
    /// <summary>
    /// 總公司數
    /// </summary>
    public int TotalCompanies { get; set; }

    /// <summary>
    /// 供給端公司數量 (CompanyType.Supplier)
    /// </summary>
    public int SupplierCount { get; set; }

    /// <summary>
    /// 需求端公司數量 (CompanyType.Buyer)
    /// </summary>
    public int BuyerCount { get; set; }

    /// <summary>
    /// 供需雙方公司數量 (CompanyType.Both)
    /// </summary>
    public int BothCount { get; set; }

    /// <summary>
    /// 已驗證公司數
    /// </summary>
    public int VerifiedCount { get; set; }

    /// <summary>
    /// 啟用狀態公司數
    /// </summary>
    public int ActiveCount { get; set; }

    /// <summary>
    /// 停用狀態公司數
    /// </summary>
    public int InactiveCount { get; set; }

    /// <summary>
    /// 按級別分組（可選）
    /// </summary>
    public CompanyLevelBreakdown? ByLevel { get; set; }

    /// <summary>
    /// 本月新增公司數
    /// </summary>
    public int CompaniesThisMonth { get; set; }

    /// <summary>
    /// 今日新增公司數
    /// </summary>
    public int CompaniesToday { get; set; }
}

/// <summary>
/// 按公司級別分組統計
/// </summary>
public class CompanyLevelBreakdown
{
    /// <summary>
    /// 基礎級別
    /// </summary>
    public int Basic { get; set; }

    /// <summary>
    /// 標準級別
    /// </summary>
    public int Standard { get; set; }

    /// <summary>
    /// 高級級別
    /// </summary>
    public int Premium { get; set; }

    /// <summary>
    /// VIP 級別
    /// </summary>
    public int VIP { get; set; }
}
