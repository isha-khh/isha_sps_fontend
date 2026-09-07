using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Mou;

/// <summary>
/// MOU 查詢參數
/// </summary>
public class MouQueryParameters
{
    public Guid? CompanyId { get; set; }
    public MouStatus? Status { get; set; }
    public string? Search { get; set; }
    public DateTime? StartDateFrom { get; set; }
    public DateTime? StartDateTo { get; set; }
    public DateTime? EndDateFrom { get; set; }
    public DateTime? EndDateTo { get; set; }

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
