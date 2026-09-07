namespace SPS.Application.DTOs.Chat;

public class ChatRecordDto
{
    public long Id { get; set; }
    public short Type { get; set; }
    public Guid? InitiatorMemberId { get; set; }
    public string? InitiatorMemberName { get; set; }
    public short? InitiatorMemberRole { get; set; }
    public string? InitiatorCompanyName { get; set; }
    public Guid? TargetMemberId { get; set; }
    public string? TargetMemberName { get; set; }
    public short? TargetMemberRole { get; set; }
    public string? TargetCompanyName { get; set; }
    public Guid? InitiatorUserId { get; set; }
    public string? InitiatorUserName { get; set; }
    public Guid? TargetUserId { get; set; }
    public string? TargetUserName { get; set; }
    public short Status { get; set; }
    public string? AgentName { get; set; }
    public MessageDto? LastMessage { get; set; }
    public int UnreadCount { get; set; }
    public DateTime CreatedTime { get; set; }
}

public class MessageDto
{
    public long Id { get; set; }
    public long ChatRecordId { get; set; }
    public Guid? SenderMemberId { get; set; }
    public string? SenderMemberName { get; set; }
    public Guid? SenderUserId { get; set; }
    public string? SenderUserName { get; set; }
    public string SenderType { get; set; } = string.Empty;
    public string? SenderAvatarUrl { get; set; }
    public string? Text { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedTime { get; set; }
}

public class SendMessageRequest
{
    public string Text { get; set; } = string.Empty;
}

public class CreateChatRequest
{
    public Guid TargetMemberId { get; set; }
}

public class CreateAdminChatRequest
{
    public Guid? AdminUserId { get; set; }
}
