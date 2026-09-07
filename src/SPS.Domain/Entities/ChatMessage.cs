using SPS.Domain.Common;

namespace SPS.Domain.Entities;

/// <summary>
/// 聊天消息實體
/// </summary>
public class ChatMessage : BaseEntity<Guid>
{
    /// <summary>
    /// 會話 ID
    /// </summary>
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// 發送者 ID (如果是訪客則為 null)
    /// </summary>
    public Guid? SenderId { get; set; }

    /// <summary>
    /// 發送者類型: visitor, agent, system
    /// </summary>
    public string SenderType { get; set; } = "visitor";

    /// <summary>
    /// 發送者名稱
    /// </summary>
    public string SenderName { get; set; } = string.Empty;

    /// <summary>
    /// 消息內容
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 消息類型: text, image, file
    /// </summary>
    public string MessageType { get; set; } = "text";

    /// <summary>
    /// 是否已讀
    /// </summary>
    public bool IsRead { get; set; } = false;

    /// <summary>
    /// 已讀時間
    /// </summary>
    public DateTime? ReadTime { get; set; }

    /// <summary>
    /// 附件 URL
    /// </summary>
    public string? AttachmentUrl { get; set; }

    // Navigation properties
    public UserSession Session { get; set; } = null!;
    public User? Sender { get; set; }
}