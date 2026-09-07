using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Company;

/// <summary>
/// 企業查詢參數
/// </summary>
public class CompanyQueryParameters
{
    /// <summary>
    /// 搜索關鍵字（企業名稱/編號）
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// 企業類型篩選
    /// </summary>
    public CompanyType? Type { get; set; }

    /// <summary>
    /// 企業級別篩選
    /// </summary>
    public CompanyLevel? Level { get; set; }

    /// <summary>
    /// 狀態篩選
    /// </summary>
    public Status? Status { get; set; }

    /// <summary>
    /// 是否已驗證
    /// </summary>
    public bool? IsVerified { get; set; }

    /// <summary>
    /// 頁碼（從1開始）
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// 每頁數量
    /// </summary>
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// 排序字段
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// 是否降序排列
    /// </summary>
    public bool Descending { get; set; } = true;
}
