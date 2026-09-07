namespace SPS.Domain.Entities;

/// <summary>
/// 需求-企業標籤分類關聯表（多對多）
/// 需求綁定的標籤與企業共用同一套 CategoryType.CompanyTag 分類節點，支援階層、可多選
/// </summary>
public class DemandTagCategory
{
    /// <summary>
    /// 需求 ID
    /// </summary>
    public int DemandId { get; set; }

    /// <summary>
    /// 企業標籤分類 ID（CategoryType.CompanyTag）
    /// </summary>
    public int CategoryId { get; set; }

    // Navigation properties
    public Demand Demand { get; set; } = null!;
    public Category Category { get; set; } = null!;
}
