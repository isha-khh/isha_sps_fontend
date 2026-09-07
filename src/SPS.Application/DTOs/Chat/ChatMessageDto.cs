namespace SPS.Application.DTOs.Chat;

/// <summary>
/// 聊天消息 DTO
/// </summary>
public class ChatMessageDto
{
    public Guid Id { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public Guid? SenderId { get; set; }
    public string SenderType { get; set; } = "visitor";
    public string SenderName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string MessageType { get; set; } = "text";
    public bool IsRead { get; set; }
    public DateTime? ReadTime { get; set; }
    public DateTime CreatedTime { get; set; }
}