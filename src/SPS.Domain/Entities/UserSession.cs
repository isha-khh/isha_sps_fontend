using SPS.Domain.Common;

namespace SPS.Domain.Entities;

/// <summary>
/// 访客会话实体
/// </summary>
public class UserSession : BaseEntity<string>
{
    /// <summary>
    /// SignalR 连接 ID
    /// </summary>
    public string? ConnectionId { get; set; }

    /// <summary>
    /// 本地存储的永久会话 ID
    /// </summary>
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// Google Analytics Client ID
    /// </summary>
    public string? GaClientId { get; set; }

    /// <summary>
    /// 当前访问的 URL
    /// </summary>
    public string CurrentUrl { get; set; } = string.Empty;

    /// <summary>
    /// 当前页面标题
    /// </summary>
    public string? PageTitle { get; set; }

    /// <summary>
    /// 最后活跃时间
    /// </summary>
    public DateTime LastActiveTime { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 首次连接时间
    /// </summary>
    public DateTime FirstConnectedTime { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 是否在线
    /// </summary>
    public bool IsOnline { get; set; } = true;

    /// <summary>
    /// UTM 来源标签 (JSON 字符串)
    /// </summary>
    public string? UtmTags { get; set; }

    /// <summary>
    /// 浏览器信息
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// IP 地址
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// 页面浏览历史 (JSON 数组)
    /// </summary>
    public string? PageHistory { get; set; }

    /// <summary>
    /// 关联的客服 ID
    /// </summary>
    public Guid? AgentId { get; set; }

    /// <summary>
    /// 会话状态: active, waiting, chatting, closed
    /// </summary>
    public string Status { get; set; } = "active";

    /// <summary>
    /// 断开连接时间
    /// </summary>
    public DateTime? DisconnectedTime { get; set; }

    // Navigation properties
    public ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
    public ICollection<VisitorPageView> PageViews { get; set; } = new List<VisitorPageView>();
}