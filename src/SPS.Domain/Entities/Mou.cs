using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 合作備忘錄實體
/// </summary>
public class Mou : BaseEntity<int>
{
    /// <summary>
    /// 標題
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 公司 ID
    /// </summary>
    public Guid CompanyId { get; set; }

    /// <summary>
    /// 簽署日期
    /// </summary>
    public DateTime? SignDate { get; set; }

    /// <summary>
    /// 開始日期
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// 結束日期
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// 狀態
    /// </summary>
    public MouStatus Status { get; set; }

    /// <summary>
    /// 描述 ID (多語言)
    /// </summary>
    public int? DescriptionId { get; set; }

    /// <summary>
    /// 附件 (JSON 數組)
    /// </summary>
    public string? Attachments { get; set; }

    /// <summary>
    /// 數據模式
    /// </summary>
    public DataMode DataMode { get; set; }

    // Navigation properties
    /// <summary>
    /// 公司
    /// </summary>
    public Company? Company { get; set; }

    /// <summary>
    /// 描述 (多語言)
    /// </summary>
    public MultilingualText? Description { get; set; }
}
