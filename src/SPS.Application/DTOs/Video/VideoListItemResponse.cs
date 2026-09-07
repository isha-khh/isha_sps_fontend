namespace SPS.Application.DTOs.Video;

/// <summary>
/// 影片列表項目回應資料
/// </summary>
public class VideoListItemResponse
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Uri { get; set; }
    public string? ThumbnailUri { get; set; }
    public bool Published { get; set; }
    public int? AlbumId { get; set; }
    public string? AlbumTitle { get; set; }
    public DateTime CreatedTime { get; set; }
}