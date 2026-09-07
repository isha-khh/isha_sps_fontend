namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 提供電子郵件發送服務的介面
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// 發送一般電子郵件
    /// </summary>
    Task SendEmailAsync(EmailOption option);

    /// <summary>
    /// 發送驗證郵件
    /// </summary>
    Task SendVerificationEmailUrlAsync(string to, string verificationLink);

    /// <summary>
    /// 發送電子郵件驗證碼
    /// </summary>
    Task<bool> SendVerificationEmailCodeAsync(string to, string code);

    /// <summary>
    /// 發送密碼重置郵件
    /// </summary>
    Task SendPasswordResetEmailAsync(string to, string resetLink, string userName, int expireMinutes = 30);

    /// <summary>
    /// 發送網域驗證郵件
    /// </summary>
    Task SendDomainVerificationEmailAsync(string to, string organizationName, string verificationToken);

    // ==================== 申請審核系統專用 ====================

    /// <summary>
    /// 發送申請提交確認郵件（給申請人）
    /// </summary>
    Task SendApplicationSubmittedEmailAsync(string to, string applicationNumber, string contactName);

    /// <summary>
    /// 發送新申請通知郵件（給審核員）
    /// </summary>
    Task SendNewApplicationNotificationEmailAsync(string to, string applicationNumber, string applicantEmail);

    /// <summary>
    /// 發送申請審核通過郵件（給申請人）
    /// </summary>
    Task SendApplicationApprovedEmailAsync(string to, string applicationNumber, string contactName, string loginUrl);

    /// <summary>
    /// 發送申請審核拒絕郵件（給申請人）
    /// </summary>
    Task SendApplicationRejectedEmailAsync(string to, string applicationNumber, string contactName, string rejectionReason);

    /// <summary>
    /// 發送申請補件通知郵件（給申請人）
    /// </summary>
    Task SendApplicationDocumentRequiredEmailAsync(string to, string applicationNumber, string contactName, string requiredDocuments);

    /// <summary>
    /// 發送範本郵件
    /// </summary>
    /// <param name="to">收件人</param>
    /// <param name="templateKey">範本識別碼</param>
    /// <param name="variables">變數</param>
    Task SendTemplateEmailAsync(string to, string templateKey, Dictionary<string, string> variables);

    /// <summary>
    /// 發送密碼變更通知郵件
    /// </summary>
    Task SendPasswordChangedEmailAsync(string to, string userName, string changeTime, string ipAddress);

    /// <summary>
    /// 發送需求媒合通知郵件（給匹配的供給端業者）
    /// </summary>
    Task SendDemandMatchNotificationEmailAsync(string to, string demandName, string demandIntroduction, List<string> tagNames, string? bcc = null, CancellationToken ct = default);

    /// <summary>
    /// 將 HTML 內容套用郵件版面配置（Layout），回傳含 CID 內嵌圖片的完整郵件
    /// </summary>
    Task<(string Html, Dictionary<string, (Stream Stream, string ContentType)>? LinkedResources)> WrapWithLayoutAsync(string title, string content);

    /// <summary>
    /// 將 HTML 內容套用郵件版面配置（Layout），回傳用於瀏覽器預覽的 HTML（使用實際 URL 而非 CID）
    /// </summary>
    Task<string> WrapWithLayoutForPreviewAsync(string title, string content, string baseUrl);
}

/// <summary>
/// 表示電子郵件的選項
/// </summary>
public class EmailOption
{
    /// <summary>
    /// 收件人電子郵件地址
    /// </summary>
    public string To { get; set; } = string.Empty;

    /// <summary>
    /// 郵件主旨
    /// </summary>
    public string? Subject { get; set; }

    /// <summary>
    /// 郵件內容
    /// </summary>
    public string? Body { get; set; }

    /// <summary>
    /// 副本 (CC) 電子郵件地址列表
    /// </summary>
    public List<string>? Cc { get; set; } = new();

    /// <summary>
    /// 密件副本 (BCC) 電子郵件地址列表
    /// </summary>
    public List<string>? Bcc { get; set; } = new();

    /// <summary>
    /// 郵件類型（用於日誌記錄，例如：PasswordReset, Verification, Notification）
    /// </summary>
    public string? MailType { get; set; }

    /// <summary>
    /// 內嵌圖片（CID linked resources），key = Content-ID, value = (Stream, ContentType)
    /// </summary>
    public Dictionary<string, (Stream Stream, string ContentType)>? LinkedResources { get; set; }

    /// <summary>
    /// 一般附件（非內嵌），會以 MIME multipart 形式附加。byte[] 形式重複使用安全
    /// </summary>
    public List<EmailAttachment>? Attachments { get; set; }

    /// <summary>
    /// 對應的群發活動 ID（單筆寄信留空）
    /// </summary>
    public Guid? CampaignId { get; set; }
}

/// <summary>
/// 郵件附件
/// </summary>
public class EmailAttachment
{
    public string FileName { get; set; } = string.Empty;
    public byte[] Content { get; set; } = Array.Empty<byte>();
    public string ContentType { get; set; } = "application/octet-stream";
}

/// <summary>
/// 郵件服務異常
/// </summary>
public class EmailServiceException : Exception
{
    public EmailServiceException(string message) : base(message)
    {
    }

    public EmailServiceException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
