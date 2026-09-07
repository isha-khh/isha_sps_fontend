namespace SPS.Application.DTOs.MailCampaign;

/// <summary>
/// 收件人預覽（用於 Compose 頁顯示前 N 筆）
/// </summary>
public class RecipientPreviewItem
{
    public Guid MemberId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? CompanyName { get; set; }
    public string? Position { get; set; }
}

/// <summary>
/// 預覽請求（同 send 但不寄）
/// </summary>
public class PreviewRecipientListRequest
{
    public List<Guid> CompanyIds { get; set; } = new();
    public List<Guid> MemberIds { get; set; } = new();
    public CampaignRecipientFilter? Filter { get; set; }
    public bool Broadcast { get; set; }
    /// <summary>回傳上限（預設 50）</summary>
    public int Limit { get; set; } = 50;
}

/// <summary>
/// 預覽回應
/// </summary>
public class PreviewRecipientListResponse
{
    public int TotalCount { get; set; }
    public List<RecipientPreviewItem> Items { get; set; } = new();
}
