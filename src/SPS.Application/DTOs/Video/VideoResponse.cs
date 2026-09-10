namespace SPS.Application.DTOs.Video;

/// <summary>
/// 影片回應資料
/// </summary>
public class VideoResponse
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? ContentType { get; set; }
    public string? Uri { get; set; }
    public string? ThumbnailUri { get; set; }
    public string? LinkUrl { get; set; }
    public bool PlayOnSite { get; set; }
    public bool Published { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Ordinal { get; set; }
    public int Height { get; set; }
    public int Width { get; set; }
    public int Dpi { get; set; }
    public string? Remark { get; set; }
    public int? AlbumId { get; set; }
    public string? AlbumTitle { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime UpdatedTime { get; set; }
}