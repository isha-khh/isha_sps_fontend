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

    /// <summary>會員之間的對話（Type = 1）綁定的需求（只有會員自己的對話列表會填）</summary>
    public int? DemandId { get; set; }
    public string? DemandName { get; set; }

    /// <summary>會員之間的對話：我封鎖了對方</summary>
    public bool BlockedByMe { get; set; }

    /// <summary>會員之間的對話：目前不能傳訊息（我封鎖了對方、或對方封鎖了我；不透露是哪一種）</summary>
    public bool SendBlocked { get; set; }
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

/// <summary>需求刊登者在「媒合資料維護」看到的、審核通過的供應業者回應，可以對回應者開啟對話</summary>
public class ReceivedReplyDto
{
    public int ReplyId { get; set; }
    public int DemandId { get; set; }
    public string? CompanyName { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string? ContactPhone { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime ReceivedTime { get; set; }

    /// <summary>已經開啟的對話；還沒有就是空</summary>
    public long? ChatRecordId { get; set; }
}

public class ReportChatRequest
{
    /// <summary>1 騷擾或不當言論、2 廣告或垃圾訊息、3 詐騙或可疑、4 其他</summary>
    [System.ComponentModel.DataAnnotations.Range(1, 4)]
    public int Reason { get; set; }

    [System.ComponentModel.DataAnnotations.MaxLength(1000)]
    public string? Detail { get; set; }
}

/// <summary>後台檢舉單列表</summary>
public class ChatReportAdminDto
{
    public int Id { get; set; }
    public long ChatRecordId { get; set; }
    public int? DemandId { get; set; }
    public string? DemandName { get; set; }
    public string? ReporterName { get; set; }
    public string? ReporterCompany { get; set; }
    public string? ReportedName { get; set; }
    public string? ReportedCompany { get; set; }

    /// <summary>Harassment／Spam／Fraud／Other</summary>
    public string Reason { get; set; } = string.Empty;
    public string? Detail { get; set; }

    /// <summary>New／Reviewed</summary>
    public string Status { get; set; } = string.Empty;
    public string? HandlerNote { get; set; }
    public DateTime? HandledTime { get; set; }
    public DateTime CreatedTime { get; set; }

    /// <summary>該對話是否已被關閉（不能再傳訊息）</summary>
    public bool ChatClosed { get; set; }
}

/// <summary>後台檢舉單詳情：含被檢舉對話的訊息（只有被檢舉的對話才開放給承辦人員審閱）</summary>
public class ChatReportDetailDto : ChatReportAdminDto
{
    public List<MessageDto> Messages { get; set; } = new();
}

public class UpdateChatReportRequest
{
    /// <summary>true = 已處理；false = 退回未處理</summary>
    public bool Reviewed { get; set; }

    [System.ComponentModel.DataAnnotations.MaxLength(2000)]
    public string? HandlerNote { get; set; }

    /// <summary>同時關閉該對話（雙方都不能再傳訊息）</summary>
    public bool CloseChat { get; set; }
}
