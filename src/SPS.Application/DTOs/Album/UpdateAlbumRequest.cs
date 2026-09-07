using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Album;

/// <summary>
/// 更新相簿請求
/// </summary>
public class UpdateAlbumRequest
{
    [StringLength(50, ErrorMessage = "相簿編號不能超過 50 個字元")]
    public string? Number { get; set; }

    [StringLength(200, ErrorMessage = "相簿標題不能超過 200 個字元")]
    public string? Title { get; set; }

    public bool? Published { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public int? Ordinal { get; set; }

    public int? CoverId { get; set; }
}