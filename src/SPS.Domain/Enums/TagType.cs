namespace SPS.Domain.Enums;

/// <summary>
/// 標簽類型枚舉 - 統一管理所有標簽
/// </summary>
public enum TagType
{
    /// <summary>
    /// 新聞標簽
    /// </summary>
    News = 1,

    /// <summary>
    /// 產品標簽
    /// </summary>
    Product = 2,

    /// <summary>
    /// 需求標簽
    /// </summary>
    Demand = 3,

    /// <summary>
    /// 企業標簽
    /// </summary>
    Company = 4,

    /// <summary>
    /// 課程類型（人才培育課程的「類型」篩選，後台「課程類型」頁維護；跟公告共用的關鍵字標籤是獨立的兩組）
    /// </summary>
    CourseType = 5
}