namespace SPS.Application.DTOs.MailCampaign;

/// <summary>
/// 寄送郵件活動請求
/// </summary>
public class SendCampaignRequest
{
    /// <summary>
    /// 郵件主旨（PerRecipient 模式支援 {{變數}} 替換）
    /// </summary>
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// 郵件內容（PerRecipient 模式支援 {{變數}} 替換）
    /// </summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// 公司 ID 清單：寄給這些公司底下會員
    /// </summary>
    public List<Guid> CompanyIds { get; set; } = new();

    /// <summary>
    /// 會員 ID 清單：明確指定的會員（會與 CompanyIds 結果合併並去重）
    /// </summary>
    public List<Guid> MemberIds { get; set; } = new();

    /// <summary>
    /// 寄送模式：BCC（同一封多人）或 PerRecipient（每人一封 + 變數）
    /// </summary>
    public EmailSendMode SendMode { get; set; } = EmailSendMode.Bcc;

    /// <summary>
    /// 收件人篩選條件（在公司/會員集合上再做縮窄）
    /// </summary>
    public CampaignRecipientFilter? Filter { get; set; }

    /// <summary>
    /// 排定寄送時間（UTC）；null 表示立即排入佇列
    /// </summary>
    public DateTime? ScheduleAt { get; set; }

    /// <summary>
    /// 廣播模式：true 表示「不限定公司，寄給所有 Active 會員」，可搭配 Filter 進一步縮窄
    /// （例：Broadcast=true + Filter.CompanyTypes=[Supplier] => 全部供給端會員）
    /// </summary>
    public bool Broadcast { get; set; }

    /// <summary>
    /// 是否套用系統郵件版面配置（layout / 範本外框）。預設 true
    /// </summary>
    public bool ApplyLayout { get; set; } = true;

    /// <summary>
    /// 附件 FileManagement ID 清單；寄信時會由 FileManagementService 下載並附加
    /// </summary>
    public List<Guid> AttachmentFileIds { get; set; } = new();
}
