using SPS.Domain.Common;

namespace SPS.Domain.Entities;

/// <summary>
/// 聊天對話實體（用于總結整個對話）
/// </summary>
public class ChatConversation : BaseEntity<Guid>
{
    /// <summary>
    /// 會話 ID
    /// </summary>
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// 負責的客服 ID
    /// </summary>
    public Guid? AgentId { get; set; }

    /// <summary>
    /// 對話開始時間
    /// </summary>
    public DateTime StartTime { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 對話結束時間
    /// </summary>
    public DateTime? EndTime { get; set; }

    /// <summary>
    /// 對話狀態: waiting, active, closed, abandoned
    /// </summary>
    public string Status { get; set; } = "waiting";

    /// <summary>
    /// 訪客評分 (1-5)
    /// </summary>
    public int? Rating { get; set; }

    /// <summary>
    /// 訪客反饋
    /// </summary>
    public string? Feedback { get; set; }

    /// <summary>
    /// 對話標簽 (JSON 數組)
    /// </summary>
    public string? Tags { get; set; }

    /// <summary>
    /// 對話備注
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// 消息數量
    /// </summary>
    public int MessageCount { get; set; } = 0;

    /// <summary>
    /// 訪客首次響應時間（秒）
    /// </summary>
    public int? FirstResponseTime { get; set; }

    /// <summary>
    /// 平均響應時間（秒）
    /// </summary>
    public int? AverageResponseTime { get; set; }

    // Navigation properties
    public User? Agent { get; set; }
}