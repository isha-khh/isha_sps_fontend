namespace SPS.Application.DTOs.Picture;

/// <summary>
/// 圖片回應資料
/// </summary>
public class PictureResponse
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Culture { get; set; }
    public short Type { get; set; }
    public string? ContentType { get; set; }
    public string? Uri { get; set; }
    public string? ThumbnailUri { get; set; }
    public string? LinkUrl { get; set; }
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
    public int? MultilingualImageId { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime UpdatedTime { get; set; }
}