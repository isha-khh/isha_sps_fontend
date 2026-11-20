using Microsoft.AspNetCore.Mvc.ModelBinding;
using SPS.Application.DTOs.SystemSettings;
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
    /// 標籤篩選（企業標籤分類 ID）：符合任一勾選標籤的企業
    /// </summary>
    public List<int>? TagIds { get; set; }

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

    /// <summary>
    /// 套用後台「頁面設定」的企業名錄排序（前台企業名錄列表傳 true）。沒指定 <see cref="SortBy"/> 時才有作用；
    /// 後台公司管理、首頁等其他呼叫端不傳，排序不受影響。
    /// </summary>
    public bool UseDirectorySort { get; set; }

    /// <summary>只回供給端企業（供給端與供需雙方）。由 API 依後台「內容設定」填入，不接受使用者從網址傳入</summary>
    [BindNever]
    public bool SupplierSideOnly { get; set; }

    /// <summary>已啟用的名錄排序規則，由 API 讀設定後填入，不接受使用者從網址傳入</summary>
    [BindNever]
    public List<EnterpriseSortRuleDto>? DirectorySortRules { get; set; }
}
