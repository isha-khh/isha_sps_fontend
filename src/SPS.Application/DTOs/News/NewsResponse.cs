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
    public bool Published { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedTime { get; set; }
}
