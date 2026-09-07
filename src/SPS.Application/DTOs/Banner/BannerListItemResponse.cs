namespace SPS.Application.DTOs.Banner;

/// <summary>
/// Banner 列表項目回應資料
/// </summary>
public class BannerListItemResponse
{
    public long Id { get; set; }
    public string? Name { get; set; }
    public string? ContentType { get; set; }
    public string? Uri { get; set; }
    public string? LinkUrl { get; set; }
    public string? LinkTarget { get; set; }
    public string? Remark { get; set; }
    public int ClickCount { get; set; }
    public int ViewCount { get; set; }
    public int? PositionId { get; set; }
    public string? PositionName { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime UpdatedTime { get; set; }
}