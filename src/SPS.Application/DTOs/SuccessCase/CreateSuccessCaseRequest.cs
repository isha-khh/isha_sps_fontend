using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.SuccessCase;

/// <summary>
/// 創建成功案例請求
/// </summary>
public class CreateSuccessCaseRequest
{
    /// <summary>
    /// 標題
    /// </summary>
    [Required(ErrorMessage = "標題為必填")]
    [MaxLength(200, ErrorMessage = "標題最多 200 字元")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 公司名稱
    /// </summary>
    [Required(ErrorMessage = "公司名稱為必填")]
    [MaxLength(100, ErrorMessage = "公司名稱最多 100 字元")]
    public string CompanyName { get; set; } = string.Empty;

    /// <summary>
    /// 產業
    /// </summary>
    [Required(ErrorMessage = "產業為必填")]
    [MaxLength(50, ErrorMessage = "產業最多 50 字元")]
    public string Industry { get; set; } = string.Empty;

    /// <summary>
    /// 封面圖片 URL
    /// </summary>
    [MaxLength(500, ErrorMessage = "封面圖片 URL 最多 500 字元")]
    public string? CoverImageUrl { get; set; }

    /// <summary>
    /// 摘要
    /// </summary>
    [Required(ErrorMessage = "摘要為必填")]
    [MaxLength(500, ErrorMessage = "摘要最多 500 字元")]
    public string Summary { get; set; } = string.Empty;

    /// <summary>
    /// 內容
    /// </summary>
    [Required(ErrorMessage = "內容為必填")]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 標籤
    /// </summary>
    public List<string>? Tags { get; set; }

    /// <summary>
    /// 發布日期
    /// </summary>
    public DateTime? PublishedDate { get; set; }

    /// <summary>
    /// 是否已發布
    /// </summary>
    public bool IsPublished { get; set; }
}
