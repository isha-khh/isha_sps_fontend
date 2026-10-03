namespace SPS.Application.DTOs.Banner;

/// <summary>
/// 批次累計 Banner 曝光請求
/// </summary>
public class RecordBannerViewsRequest
{
    /// <summary>
    /// 這次頁面載入顯示的 Banner id
    /// </summary>
    public List<long>? Ids { get; set; }
}
