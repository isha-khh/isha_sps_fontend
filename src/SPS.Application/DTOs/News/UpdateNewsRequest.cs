namespace SPS.Application.DTOs.News;

/// <summary>
/// 更新新聞請求
/// </summary>
public class UpdateNewsRequest
{
    public string? Title { get; set; }
    public string? Introduction { get; set; }
    public string? Content { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool? Published { get; set; }
    public int? Ordinal { get; set; }
    public int? CategoryId { get; set; }
    public short? Type { get; set; }
    public List<int>? TagIds { get; set; }

    /// <summary>沒帶（null）= 不更新；空陣列 = 清除全部附件</summary>
    public List<Guid>? AttachmentFileIds { get; set; }

    /// <summary>沒帶（null）= 不更新；空陣列 = 清除全部連結</summary>
    public List<NewsLinkItem>? RelatedLinks { get; set; }

    /// <summary>聯絡資訊：沒帶（null）= 不更新；空字串 = 清除</summary>
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
}
