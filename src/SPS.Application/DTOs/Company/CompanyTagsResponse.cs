namespace SPS.Application.DTOs.Company;

/// <summary>
/// 企業標籤綁定結果
/// </summary>
public class CompanyTagsResponse
{
    /// <summary>
    /// 企業 ID
    /// </summary>
    public Guid CompanyId { get; set; }

    /// <summary>
    /// 已綁定的企業標籤 ID 集合
    /// </summary>
    public List<int> TagIds { get; set; } = new();

    /// <summary>
    /// 已綁定的企業標籤名稱集合（與 TagIds 對應）
    /// </summary>
    public List<string> TagNames { get; set; } = new();
}
