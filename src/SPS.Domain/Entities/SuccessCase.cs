using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 成功案例實體
/// </summary>
public class SuccessCase : BaseEntity<int>
{
    /// <summary>
    /// 標題（多語言）
    /// </summary>
    public int TitleId { get; set; }

    /// <summary>
    /// 公司名稱
    /// </summary>
    public string CompanyName { get; set; } = string.Empty;

    /// <summary>
    /// 產業
    /// </summary>
    public string Industry { get; set; } = string.Empty;

    /// <summary>
    /// 封面圖片 URL
    /// </summary>
    public string? CoverImageUrl { get; set; }

    /// <summary>
    /// 摘要（多語言）
    /// </summary>
    public int SummaryId { get; set; }

    /// <summary>
    /// 內容（多語言）
    /// </summary>
    public int ContentId { get; set; }

    /// <summary>
    /// 標籤（JSON 數組）
    /// </summary>
    public string? Tags { get; set; }

    /// <summary>
    /// 發布日期
    /// </summary>
    public DateTime? PublishedDate { get; set; }

    /// <summary>
    /// 是否已發布
    /// </summary>
    public bool IsPublished { get; set; }

    /// <summary>
    /// 瀏覽次數
    /// </summary>
    public int ViewCount { get; set; }

    /// <summary>
    /// 數據模式
    /// </summary>
    public DataMode DataMode { get; set; }

    // Navigation Properties
    public MultilingualText? Title { get; set; }
    public MultilingualText? Summary { get; set; }
    public MultilingualText? Content { get; set; }
}
