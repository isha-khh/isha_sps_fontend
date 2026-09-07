using SPS.Domain.Common;

namespace SPS.Domain.Entities;

/// <summary>
/// 访客页面浏览记录
/// </summary>
public class VisitorPageView : BaseEntity<Guid>
{
    /// <summary>
    /// 会话 ID
    /// </summary>
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// 页面 URL
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// 页面标题
    /// </summary>
    public string? Title { get; set; }

    /// <summary>
    /// 访问时间
    /// </summary>
    public DateTime ViewTime { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 停留时间（秒）
    /// </summary>
    public int? DurationSeconds { get; set; }

    /// <summary>
    /// 来源 URL
    /// </summary>
    public string? ReferrerUrl { get; set; }

    // Navigation properties
    public UserSession Session { get; set; } = null!;
}