namespace SPS.Application.DTOs.News;

/// <summary>服務專區項目的附件下載資訊（填完「立即下載」表單後才會回傳給使用者）</summary>
public class NewsAttachmentDto
{
    public Guid FileId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FormattedFileSize { get; set; } = string.Empty;

    /// <summary>下載網址（相對於 API 位址，前台要補上 basePath／API 位址）</summary>
    public string Url { get; set; } = string.Empty;
}
