using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class News : BaseEntity<int>
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool Published { get; set; }
    public int Ordinal { get; set; }
    public int? TitleId { get; set; }
    public int? IntroductionId { get; set; }
    public int? ContentId { get; set; }
    public int? PictureId { get; set; }
    public int? CategoryId { get; set; }
    public short Type { get; set; }
    public int ViewCount { get; set; }

    /// <summary>附件：檔案管理中的檔案 Id（依顯示順序），公開公告的附件任何人都可以下載</summary>
    public List<Guid> AttachmentFileIds { get; set; } = new();

    /// <summary>相關連結（JSON 文字：[{ "title": "...", "url": "https://..." }]），由 NewsService 讀寫</summary>
    public string? RelatedLinksJson { get; set; }

    /// <summary>聯絡資訊（前台詳情頁「聯絡資訊」區塊）</summary>
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }

    // Navigation properties
    public MultilingualText? Title { get; set; }
    public MultilingualText? Introduction { get; set; }
    public MultilingualText? Content { get; set; }
    public MultilingualImage? Picture { get; set; }
    public Category? Category { get; set; }
    public ICollection<File> Files { get; set; } = new List<File>();
}
