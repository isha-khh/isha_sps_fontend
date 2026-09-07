using SPS.Application.DTOs.Common;

namespace SPS.Application.DTOs.Video;

/// <summary>
/// 影片查詢參數
/// </summary>
public class VideoQueryParameters : QueryParameters
{
    /// <summary>
    /// 影片名稱（模糊搜索）
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 相簿 ID
    /// </summary>
    public int? AlbumId { get; set; }

    /// <summary>
    /// 發布狀態
    /// </summary>
    public bool? Published { get; set; }
}