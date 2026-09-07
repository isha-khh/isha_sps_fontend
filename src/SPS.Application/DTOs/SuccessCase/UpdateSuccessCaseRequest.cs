using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.SuccessCase;

/// <summary>
/// 更新成功案例請求
/// </summary>
public class UpdateSuccessCaseRequest
{
    /// <summary>
    /// 標題
    /// </summary>
    [MaxLength(200, ErrorMessage = "標題最多 200 字元")]
    public string? Title { get; set; }

    /// <summary>
    /// 公司名稱
    /// </summary>
    [MaxLength(100, ErrorMessage = "公司名稱最多 100 字元")]
    public string? CompanyName { get; set; }

    /// <summary>
    /// 產業
    /// </summary>
    [MaxLength(50, ErrorMessage = "產業最多 50 字元")]
    public string? Industry { get; set; }

    /// <summary>
    /// 封面圖片 URL
    /// </summary>
    [MaxLength(500, ErrorMessage = "封面圖片 URL 最多 500 字元")]
    public string? CoverImageUrl { get; set; }

    /// <summary>
    /// 摘要
    /// </summary>
    [MaxLength(500, ErrorMessage = "摘要最多 500 字元")]
    public string? Summary { get; set; }

    /// <summary>
    /// 內容
    /// </summary>
    public string? Content { get; set; }

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
    public bool? IsPublished { get; set; }
}
