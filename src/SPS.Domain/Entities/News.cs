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

    /// <summary>所屬專區（<see cref="SPS.Domain.Enums.NewsSection"/>）：0 公告、1 服務專區。與 <see cref="Type"/>（一般／重要／緊急）是不同的東西</summary>
    public short Section { get; set; }

    /// <summary>
    /// 附件：檔案管理中的檔案 Id（依顯示順序）。服務專區用——附件不在公開頁面列出，使用者填完「立即下載」表單才拿得到連結；
    /// 公告的附件是內文裡的「附件下載」區塊，不用這個欄位
    /// </summary>
    public List<Guid> AttachmentFileIds { get; set; } = new();
    public int ViewCount { get; set; }

    // Navigation properties
    public MultilingualText? Title { get; set; }
    public MultilingualText? Introduction { get; set; }
    public MultilingualText? Content { get; set; }
    public MultilingualImage? Picture { get; set; }
    public Category? Category { get; set; }
    public ICollection<File> Files { get; set; } = new List<File>();
}
