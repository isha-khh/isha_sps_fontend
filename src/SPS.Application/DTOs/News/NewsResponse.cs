namespace SPS.Application.DTOs.News;

/// <summary>
/// 新聞響應
/// </summary>
public class NewsResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Introduction { get; set; }
    public string? Content { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool Published { get; set; }
    public int Ordinal { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public short Type { get; set; }
    public int ViewCount { get; set; }
    public List<string> Tags { get; set; } = new();
    public DateTime CreatedTime { get; set; }
    public DateTime? UpdatedTime { get; set; }

    /// <summary>
    /// 封面圖網址（來自 News.Picture.DefaultImageUri），沒有設定圖片時為 null
    /// </summary>
    public string? ImageUrl { get; set; }
}

/// <summary>
/// 新聞列表項響應
/// </summary>
public class NewsListItemResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Introduction { get; set; }
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// 結束日期。前台用「有沒有這個欄位」來判斷這篇公告算不算「活動」
    /// （有起訖區間），再自己用 StartDate/EndDate 跟現在時間比對算出
    /// 「即將開始／進行中／已結束」的狀態標籤，後端不用另外存一個
    /// 狀態欄位。
    /// </summary>
    public DateTime? EndDate { get; set; }
    public bool Published { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedTime { get; set; }

    /// <summary>
    /// 標簽列表——原本只有詳情 API（NewsResponse）有帶，列表卡片需要
    /// 顯示關鍵字標籤，一併補上
    /// </summary>
    public List<string> Tags { get; set; } = new();

    /// <summary>
    /// 封面圖網址（來自 News.Picture.DefaultImageUri），沒有設定圖片時為 null
    /// </summary>
    public string? ImageUrl { get; set; }
}
