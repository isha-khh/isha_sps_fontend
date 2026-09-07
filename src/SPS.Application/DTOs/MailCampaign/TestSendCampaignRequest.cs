namespace SPS.Application.DTOs.MailCampaign;

/// <summary>
/// 測試寄送請求：把目前撰寫中的主旨/內容套用變數後寄到指定 email，不建立 Campaign
/// </summary>
public class TestSendCampaignRequest
{
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// 測試收件人 email
    /// </summary>
    public string TestEmail { get; set; } = string.Empty;

    /// <summary>
    /// 是否套用系統郵件版型（同 Send 流程，預設 true）
    /// </summary>
    public bool ApplyLayout { get; set; } = true;

    /// <summary>
    /// 變數值（{{Name}}、{{CompanyName}} 等）；空字串會原樣替換為空字串
    /// </summary>
    public Dictionary<string, string> Variables { get; set; } = new();

    /// <summary>
    /// 附件 FileManagement ID 清單；測試寄送會即時下載並附加，不寫進資料庫
    /// </summary>
    public List<Guid> AttachmentFileIds { get; set; } = new();
}
