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
    /// <summary>主分類（<see cref="CategoryIds"/> 的第一個）。舊資料與只認單一分類的地方（後台列表、麵包屑）沿用這個欄位</summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// 所有分類 Id（依選擇順序）。產業輔導的「產業別」可以多選，一則輔導可以屬於多個產業別；沒有多選需求的專區就只有一個，
    /// 內容與 <see cref="CategoryId"/> 一致。依分類篩選時兩個欄位都要比對（見 NewsRepository）
    /// </summary>
    public List<int> CategoryIds { get; set; } = new();
    public short Type { get; set; }

    /// <summary>所屬專區（<see cref="SPS.Domain.Enums.NewsSection"/>）：0 公告、1 服務專區。與 <see cref="Type"/>（一般／重要／緊急）是不同的東西</summary>
    public short Section { get; set; }

    /// <summary>
    /// 附件：檔案管理中的檔案 Id（依顯示順序）。服務專區用——附件不在公開頁面列出，使用者填完「立即下載」表單才拿得到連結；
    /// 公告的附件是內文裡的「附件下載」區塊，不用這個欄位
    /// </summary>
    public List<Guid> AttachmentFileIds { get; set; } = new();

    /// <summary>各專區的專屬欄位（人才培育的講師、產業輔導的主辦單位…），欄位名稱見 <see cref="SPS.Domain.Enums.NewsSection.MetaKeys"/>；存成 jsonb</summary>
    public Dictionary<string, string> Meta { get; set; } = new();
    public int ViewCount { get; set; }

    // Navigation properties
    public MultilingualText? Title { get; set; }
    public MultilingualText? Introduction { get; set; }
    public MultilingualText? Content { get; set; }
    public MultilingualImage? Picture { get; set; }
    public Category? Category { get; set; }
    public ICollection<File> Files { get; set; } = new List<File>();
}
