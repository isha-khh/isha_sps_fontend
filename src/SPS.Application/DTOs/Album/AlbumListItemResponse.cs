namespace SPS.Application.DTOs.Album;

/// <summary>
/// 相簿列表項目回應資料
/// </summary>
public class AlbumListItemResponse
{
    public int Id { get; set; }
    public string? Number { get; set; }
    public string? Title { get; set; }
    public bool Published { get; set; }
    public DateTime? StartDate { get; set; }
    public int Ordinal { get; set; }
    public string? CoverUri { get; set; }
    public int PictureCount { get; set; }
    public int VideoCount { get; set; }
    public DateTime CreatedTime { get; set; }
}