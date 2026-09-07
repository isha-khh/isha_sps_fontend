using SPS.Application.DTOs.Common;

namespace SPS.Application.DTOs.Album;

/// <summary>
/// 相簿查詢參數
/// </summary>
public class AlbumQueryParameters : QueryParameters
{
    /// <summary>
    /// 相簿標題（模糊搜索）
    /// </summary>
    public string? Title { get; set; }

    /// <summary>
    /// 發布狀態
    /// </summary>
    public bool? Published { get; set; }

    /// <summary>
    /// 開始日期（從）
    /// </summary>
    public DateTime? StartDateFrom { get; set; }

    /// <summary>
    /// 開始日期（到）
    /// </summary>
    public DateTime? StartDateTo { get; set; }
}