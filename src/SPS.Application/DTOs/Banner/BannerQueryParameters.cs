using SPS.Application.DTOs.Common;

namespace SPS.Application.DTOs.Banner;

/// <summary>
/// Banner 查詢參數
/// </summary>
public class BannerQueryParameters : QueryParameters
{
    /// <summary>
    /// Banner 名稱（模糊搜索）
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 位置 ID
    /// </summary>
    public int? PositionId { get; set; }
}