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

    /// <summary>
    /// 上架狀態過濾（前台匿名呼叫時 controller 會強制為 true）
    /// </summary>
    public bool? Published { get; set; }
}