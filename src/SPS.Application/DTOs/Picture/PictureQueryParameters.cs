using SPS.Application.DTOs.Common;

namespace SPS.Application.DTOs.Picture;

/// <summary>
/// 圖片查詢參數
/// </summary>
public class PictureQueryParameters : QueryParameters
{
    /// <summary>
    /// 圖片名稱（模糊搜索）
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

    /// <summary>
    /// 圖片類型
    /// </summary>
    public short? Type { get; set; }
}