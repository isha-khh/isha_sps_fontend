namespace SPS.Application.DTOs.MailCampaign;

/// <summary>
/// 郵件活動寄送結果
/// </summary>
public class CampaignResultResponse
{
    public Guid CampaignId { get; set; }

    /// <summary>解析後的收件人總數（去重後）</summary>
    public int TotalRecipients { get; set; }

    /// <summary>實際成功寄出的批次數量</summary>
    public int SuccessBatches { get; set; }

    /// <summary>失敗的批次數量</summary>
    public int FailedBatches { get; set; }

    /// <summary>活動狀態</summary>
    public int Status { get; set; }

    public DateTime? StartedTime { get; set; }
    public DateTime? CompletedTime { get; set; }
    public string? ErrorMessage { get; set; }
}
