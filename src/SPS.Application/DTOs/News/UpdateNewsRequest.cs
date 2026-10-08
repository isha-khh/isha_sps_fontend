namespace SPS.Application.DTOs.News;

/// <summary>
/// 更新新聞請求
/// </summary>
public class UpdateNewsRequest
{
    public string? Title { get; set; }
    public string? Introduction { get; set; }
    public string? Content { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool? Published { get; set; }
    public int? Ordinal { get; set; }
    public int? CategoryId { get; set; }
    public short? Type { get; set; }
    public List<int>? TagIds { get; set; }
}
