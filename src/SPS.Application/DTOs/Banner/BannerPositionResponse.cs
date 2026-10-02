namespace SPS.Application.DTOs.Banner;

/// <summary>
/// Banner 版位（後台新增/編輯 Banner 時的下拉選單用）。版位是固定的，由 migration 預先建立，
/// 目前有：home-hero（首頁主視覺）、news-top（公告頂部輪播）。
/// </summary>
public class BannerPositionResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
    public string? Remark { get; set; }
}
