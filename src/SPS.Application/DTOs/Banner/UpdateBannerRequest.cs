using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Banner;

/// <summary>
/// 更新 Banner 請求
/// </summary>
public class UpdateBannerRequest
{
    [StringLength(200, ErrorMessage = "Banner 名稱不能超過 200 個字元")]
    public string? Name { get; set; }

    [StringLength(100, ErrorMessage = "內容類型不能超過 100 個字元")]
    public string? ContentType { get; set; }

    [StringLength(500, ErrorMessage = "URI 不能超過 500 個字元")]
    public string? Uri { get; set; }

    [StringLength(500, ErrorMessage = "連結網址不能超過 500 個字元")]
    public string? LinkUrl { get; set; }

    [StringLength(10, ErrorMessage = "連結開啟方式不能超過 10 個字元")]
    [RegularExpression("^(_blank|_self)$", ErrorMessage = "連結開啟方式只能是 _blank 或 _self")]
    public string? LinkTarget { get; set; }

    [StringLength(1000, ErrorMessage = "備註不能超過 1000 個字元")]
    public string? Remark { get; set; }

    public int? PositionId { get; set; }
}