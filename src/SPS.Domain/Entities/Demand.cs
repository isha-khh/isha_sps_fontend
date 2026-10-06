using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

public class Demand : BaseEntity<int>
{
    public DataMode DataMode { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Remark { get; set; }
    public int? PictureId { get; set; }
    public int? CategoryId { get; set; }
    public Guid? CompanyId { get; set; }
    public Status Status { get; set; }

    /// <summary>地點（前台列表與詳情顯示，例如「高雄市小港區」）</summary>
    public string? Location { get; set; }

    /// <summary>公開摘要：所有訪客都看得到；完整內容（Description）與附件只有企業會員與後台看得到</summary>
    public string? PublicSummary { get; set; }

    /// <summary>附件：檔案管理中的檔案 Id（依顯示順序）</summary>
    public List<Guid> AttachmentFileIds { get; set; } = new();

    // Navigation properties
    public Picture? Picture { get; set; }
    public Category? Category { get; set; }
    public Company? Company { get; set; }
    public ICollection<MemberDemand> MemberDemands { get; set; } = new List<MemberDemand>();
    public ICollection<File> Files { get; set; } = new List<File>();
}
