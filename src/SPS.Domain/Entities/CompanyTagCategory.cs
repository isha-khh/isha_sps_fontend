namespace SPS.Domain.Entities;

/// <summary>
/// 企業-企業標籤分類關聯表（多對多）
/// 企業綁定的「企業標籤」即為 CategoryType.CompanyTag 的分類節點，支援階層、可多選
/// </summary>
public class CompanyTagCategory
{
    /// <summary>
    /// 企業 ID
    /// </summary>
    public Guid CompanyId { get; set; }

    /// <summary>
    /// 企業標籤分類 ID（CategoryType.CompanyTag）
    /// </summary>
    public int CategoryId { get; set; }

    // Navigation properties
    public Company Company { get; set; } = null!;
    public Category Category { get; set; } = null!;
}
