namespace SPS.Application.DTOs.News;

/// <summary>
/// 創建新聞請求
/// </summary>
public class CreateNewsRequest
{
    /// <summary>
    /// 標題
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 簡介
    /// </summary>
    public string? Introduction { get; set; }

    /// <summary>
    /// 內容
    /// </summary>
    public string? Content { get; set; }

    /// <summary>
    /// 開始日期
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// 結束日期
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// 是否發布
    /// </summary>
    public bool Published { get; set; }

    /// <summary>
    /// 排序號
    /// </summary>
    public int Ordinal { get; set; }

    /// <summary>
    /// 分類ID
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// 類型（0=公告，1=新聞等）
    /// </summary>
    public short Type { get; set; }

    /// <summary>
    /// 標簽ID列表
    /// </summary>
    public List<int>? TagIds { get; set; }
}
