namespace SPS.Application.DTOs.MailCampaign;

public class CampaignListItemResponse
{
    public Guid Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public int Status { get; set; }
    public string? StatusText { get; set; }
    public int SendMode { get; set; }
    public DateTime? ScheduleAt { get; set; }
    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime? StartedTime { get; set; }
    public DateTime? CompletedTime { get; set; }
    public string? ErrorMessage { get; set; }
}

public class CampaignDetailResponse : CampaignListItemResponse
{
    public string Body { get; set; } = string.Empty;
    public string? RecipientSnapshot { get; set; }
    public bool ApplyLayout { get; set; }
    public List<CampaignAttachmentItem> Attachments { get; set; } = new();
}

public class CampaignAttachmentItem
{
    public Guid Id { get; set; }
    public Guid FileId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public long FileSize { get; set; }
}

public class CampaignListQueryParameters
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    /// <summary>狀態篩選（對應 EmailCampaignStatus 數值）</summary>
    public int? Status { get; set; }
    public string? Search { get; set; }
}
