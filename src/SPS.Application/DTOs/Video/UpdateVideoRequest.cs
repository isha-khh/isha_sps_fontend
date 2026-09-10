using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Video;

/// <summary>
/// 更新影片請求
/// </summary>
public class UpdateVideoRequest
{
    [StringLength(200, ErrorMessage = "影片名稱不能超過 200 個字元")]
    public string? Name { get; set; }

    [StringLength(100, ErrorMessage = "內容類型不能超過 100 個字元")]
    public string? ContentType { get; set; }

    [StringLength(500, ErrorMessage = "URI 不能超過 500 個字元")]
    public string? Uri { get; set; }

    [StringLength(500, ErrorMessage = "縮圖 URI 不能超過 500 個字元")]
    public string? ThumbnailUri { get; set; }

    [StringLength(500, ErrorMessage = "連結網址不能超過 500 個字元")]
    public string? LinkUrl { get; set; }

    public bool? PlayOnSite { get; set; }

    public bool? Published { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public int? Ordinal { get; set; }

    public int? Height { get; set; }

    public int? Width { get; set; }

    public int? Dpi { get; set; }

    [StringLength(1000, ErrorMessage = "備註不能超過 1000 個字元")]
    public string? Remark { get; set; }

    public int? AlbumId { get; set; }
}