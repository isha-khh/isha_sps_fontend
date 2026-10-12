namespace SPS.Application.DTOs.MemberNotification;

public class MemberNotificationDto
{
    public long Id { get; set; }

    /// <summary>ReplyReviewed／ReplyReceived／DemandMatched／InquiryReplied</summary>
    public string Type { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }

    /// <summary>前台站內路徑（以 / 開頭）；沒有就不顯示「查看」</summary>
    public string? LinkPath { get; set; }

    public bool IsRead { get; set; }
    public DateTime CreatedTime { get; set; }
}

public class MemberNotificationListResponse
{
    public List<MemberNotificationDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int UnreadCount { get; set; }
}
