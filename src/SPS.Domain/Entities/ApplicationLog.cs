using SPS.Domain.Common;
using SPS.Domain.Enums;

namespace SPS.Domain.Entities;

/// <summary>
/// 申請日志
/// </summary>
public class ApplicationLog : BaseEntity<Guid>
{
    /// <summary>
    /// 申請ID
    /// </summary>
    public Guid ApplicationId { get; set; }

    /// <summary>
    /// 原狀態
    /// </summary>
    public ApplicationStatus? FromStatus { get; set; }

    /// <summary>
    /// 新狀態
    /// </summary>
    public ApplicationStatus? ToStatus { get; set; }

    /// <summary>
    /// 操作人ID
    /// </summary>
    public Guid? OperatorId { get; set; }

    /// <summary>
    /// 操作類型
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// 備注
    /// </summary>
    public string? Comment { get; set; }

    /// <summary>
    /// IP地址
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// 操作時間
    /// </summary>
    public DateTime OperatedAt { get; set; }

    // ==================== 導航屬性 ====================

    /// <summary>
    /// 關聯申請
    /// </summary>
    public MemberApplication Application { get; set; } = null!;
}
