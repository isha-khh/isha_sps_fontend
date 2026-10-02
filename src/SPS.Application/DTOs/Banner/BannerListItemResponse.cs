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
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Description { get; set; }
    public string? ButtonText { get; set; }
    public string? SecondaryButtonText { get; set; }
    public string? SecondaryLinkUrl { get; set; }
    public int Ordinal { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool Published { get; set; }
    public string? PositionName { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime UpdatedTime { get; set; }
}