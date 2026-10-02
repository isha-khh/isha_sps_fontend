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

    /// <summary>
    /// 版位。注意：版位、StartDate、EndDate 三項是「以請求為準」，沒帶＝清除，不是不更新
    /// </summary>
    public int? PositionId { get; set; }

    [StringLength(200, ErrorMessage = "主標題不能超過 200 個字元")]
    public string? Title { get; set; }

    [StringLength(200, ErrorMessage = "副標題不能超過 200 個字元")]
    public string? Subtitle { get; set; }

    [StringLength(1000, ErrorMessage = "說明文字不能超過 1000 個字元")]
    public string? Description { get; set; }

    [StringLength(50, ErrorMessage = "按鈕文字不能超過 50 個字元")]
    public string? ButtonText { get; set; }

    [StringLength(50, ErrorMessage = "第二顆按鈕文字不能超過 50 個字元")]
    public string? SecondaryButtonText { get; set; }

    [StringLength(500, ErrorMessage = "第二顆按鈕連結不能超過 500 個字元")]
    public string? SecondaryLinkUrl { get; set; }

    public int? Ordinal { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool? Published { get; set; }
}