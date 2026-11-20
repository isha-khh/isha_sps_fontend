using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class Regulations : BaseEntity<int>
{
    public DataMode DataMode { get; set; }
    public string? Name { get; set; }
    public bool Published { get; set; }

    /// <summary>
    /// 內容檢查（後台「系統設定 → 內容檢查」）發現問題而自動轉成草稿時，寫下原因（哪個區塊、什麼規則）；沒被自動轉草稿過、或重新發布之後為 null。
    /// 規則見 <c>ArticleContentRules</c>。重新發布（<c>Published = true</c>）會清掉這個欄位。
    /// </summary>
    public string? UnpublishReason { get; set; }
    public short Type { get; set; }
    public int Ordinal { get; set; }
    public int? PictureId { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public int? CategoryId { get; set; }

    // Navigation properties
    public Picture? Picture { get; set; }
    public Category? Category { get; set; }
    public ICollection<File> Files { get; set; } = new List<File>();
}
