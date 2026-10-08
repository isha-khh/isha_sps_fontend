using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.News;

/// <summary>公告的相關連結（只接受 http／https 網址）</summary>
public class NewsLinkItem
{
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Url { get; set; } = string.Empty;
}

/// <summary>公告附件的下載資訊（詳情 API 回傳）</summary>
public class NewsAttachmentDto
{
    public Guid FileId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FormattedFileSize { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}
