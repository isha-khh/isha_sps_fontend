using SPS.Application.Common;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 工商平台服務接口
/// </summary>
public interface IBusinessRegistryService
{
    /// <summary>
    /// 驗證統一編號
    /// </summary>
    Task<Result<bool>> VerifyUnifiedSocialCreditCodeAsync(
        string unifiedSocialCreditCode,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取企業信息
    /// </summary>
    Task<Result<CompanyRegistryInfo>> GetCompanyInfoAsync(
        string unifiedSocialCreditCode,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// 企業登記信息
/// </summary>
public class CompanyRegistryInfo
{
    /// <summary>
    /// 統一編號
    /// </summary>
    public string UnifiedSocialCreditCode { get; set; } = string.Empty;

    /// <summary>
    /// 設立狀態
    /// </summary>
    public string? CompanyStatusDesc { get; set; }

    /// <summary>
    /// 企業名稱
    /// </summary>
    public string CompanyName { get; set; } = string.Empty;

    /// <summary>
    /// 資本總額(元)
    /// </summary>
    public string? CapitalStockAmount { get; set; }

    /// <summary>
    /// 實收資本額(元)
    /// </summary>
    public string? PaidInCapitalAmount { get; set; }

    /// <summary>
    /// 代表人姓名
    /// </summary>
    public string? ResponsibleName { get; set; }

    /// <summary>
    /// 企業地址
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// 登記機關
    /// </summary>
    public string? RegisterOrganizationDesc { get; set; }

    /// <summary>
    /// 核准設立日期
    /// </summary>
    public string? CompanySetupDate { get; set; }

    /// <summary>
    /// 最後核准變更日期
    /// </summary>
    public string? ChangeOfApprovalData { get; set; }

    /// <summary>
    /// 撤銷日期
    /// </summary>
    public string? RevokeAppDate { get; set; }

    /// <summary>
    /// 案件狀態
    /// </summary>
    public string? CaseStatus { get; set; }

    /// <summary>
    /// 案件狀態說明
    /// </summary>
    public string? CaseStatusDesc { get; set; }

    /// <summary>
    /// 停業日期(起)
    /// </summary>
    public string? SusBegDate { get; set; }

    /// <summary>
    /// 停業日期(迄)
    /// </summary>
    public string? SusEndDate { get; set; }

    /// <summary>
    /// 停業核准日期
    /// </summary>
    public string? SusAppDate { get; set; }
    
    // Legacy properties for compatibility (mapped from above)
    public string? BusinessScope { get; set; } // API doesn't seem to return this in the specified fields, keep null or map if found
    public string? LegalRepresentative { get => ResponsibleName; set => ResponsibleName = value; }
    public string? RegisteredCapital { get => CapitalStockAmount; set => CapitalStockAmount = value; }
    public DateTime? EstablishmentDate { get; set; } // Parsed from CompanySetupDate
    public string? Status { get => CompanyStatusDesc; set => CompanyStatusDesc = value; }
}
