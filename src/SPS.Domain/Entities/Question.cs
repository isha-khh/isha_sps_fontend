using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class Question : BaseEntity<int>
{
    public bool Published { get; set; }

    /// <summary>
    /// 內容檢查（背景索引時跑）發現問題而自動轉成草稿時，寫下原因（哪個區塊、什麼規則）；沒被自動轉草稿過、或重新發布之後為 null。
    /// 規則見 <c>ArticleContentRules</c>。重新發布（<c>Published = true</c>）會清掉這個欄位。
    /// </summary>
    public string? UnpublishReason { get; set; }
    public int Ordinal { get; set; }
    public int? SubjectId { get; set; }
    public int? AnswerId { get; set; }
    public int? CategoryId { get; set; }
    public int? PictureId { get; set; }

    // Navigation properties
    public MultilingualText? Subject { get; set; }
    public MultilingualText? Answer { get; set; }
    public Category? Category { get; set; }
    public MultilingualImage? Picture { get; set; }
    public ICollection<File> Files { get; set; } = new List<File>();
}
