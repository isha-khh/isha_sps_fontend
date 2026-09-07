using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Net.Security;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SmtpClient = MailKit.Net.Smtp.SmtpClient;

namespace SPS.Infrastructure.Services;

/// <summary>
///     電子郵件設定類別，包含 SMTP 相關配置。
/// </summary>
public class EmailSettings
{
    /// <summary>
    ///     SMTP 伺服器地址。
    /// </summary>
    public string SmtpServer { get; set; } = string.Empty;

    /// <summary>
    ///     SMTP 伺服器端口號。
    /// </summary>
    public int SmtpPort { get; set; }

    /// <summary>
    ///     SMTP 使用者名稱。
    /// </summary>
    public string SmtpUsername { get; set; } = string.Empty;

    /// <summary>
    ///     SMTP 密碼。
    /// </summary>
    public string SmtpPassword { get; set; } = string.Empty;

    /// <summary>
    ///     發件人電子郵件地址。
    /// </summary>
    public string FromEmail { get; set; } = string.Empty;

    /// <summary>
    ///     發件人名稱。
    /// </summary>
    public string FromName { get; set; } = string.Empty;

    /// <summary>
    ///     是否啟用 SSL 加密。
    /// </summary>
    public bool EnableSsl { get; set; }
}

/// <summary>
///     提供電子郵件發送功能的服務。
/// </summary>
public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly EmailSettings _settings;
    private readonly ISystemSettingService _systemSettingService;
    private readonly IFileManagementService _fileManagementService;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _dbContext;

    public EmailService(
        IOptions<EmailSettings> settings,
        ISystemSettingService systemSettingService,
        IFileManagementService fileManagementService,
        IConfiguration configuration,
        ApplicationDbContext dbContext,
        ILogger<EmailService> logger)
    {
        _settings = settings.Value;
        _systemSettingService = systemSettingService;
        _fileManagementService = fileManagementService;
        _configuration = configuration;
        _dbContext = dbContext;
        _logger = logger;
        ConfigureServerCertificateValidation();
    }


    /// <summary>
    ///     發送電子郵件，支援收件人、副本 (CC) 和密件副本 (BCC)。
    /// </summary>
    /// <param name="option">包含電子郵件發送資訊的選項。</param>
    /// <exception cref="EmailServiceException">當郵件發送失敗時拋出異常。</exception>
    public async Task SendEmailAsync(EmailOption option)
    {
        var mailLog = new MailLog
        {
            Subject = option.Subject,
            Receivers = option.To,
            Content = option.Body,
            MailType = option.MailType,
            ReceiverCount = 1 + (option.Cc?.Count ?? 0) + (option.Bcc?.Count ?? 0),
            Time = DateTime.UtcNow,
            CreatedTime = DateTime.UtcNow,
            IsSuccess = false,
            CampaignId = option.CampaignId
        };

        try
        {
            // 優先從資料庫讀取 SMTP 設定，若無則使用 appsettings.json
            var dbSettings = await _systemSettingService.GetSettingAsync<EmailSettingsDto>("Email");

            // 檢查郵件服務是否啟用
            if (dbSettings.IsSuccess && dbSettings.Data != null && !dbSettings.Data.IsEnabled)
            {
                _logger.LogInformation("Email service is disabled, skipping email to {To}", option.To);
                mailLog.IsSuccess = false;
                mailLog.ErrorMessage = "郵件服務已停用";
                return;
            }

            string smtpServer, username, password, fromEmail, fromName;
            int smtpPort;
            bool enableSsl;

            if (dbSettings.IsSuccess && dbSettings.Data != null && !string.IsNullOrEmpty(dbSettings.Data.SmtpServer))
            {
                var emailSettings = dbSettings.Data;
                smtpServer = emailSettings.SmtpServer;
                smtpPort = emailSettings.Port;
                username = emailSettings.UserName;
                password = emailSettings.Password;
                fromEmail = emailSettings.SenderEmail;
                fromName = emailSettings.SenderName;
                enableSsl = emailSettings.EnableSsl;
                _logger.LogDebug("Using email settings from database");
            }
            else
            {
                smtpServer = _settings.SmtpServer;
                smtpPort = _settings.SmtpPort;
                username = _settings.SmtpUsername;
                password = _settings.SmtpPassword;
                fromEmail = _settings.FromEmail;
                fromName = _settings.FromName;
                enableSsl = _settings.EnableSsl;
                _logger.LogDebug("Using email settings from appsettings.json");
            }

            // 產生唯一的 Message-ID 用於追蹤退信
            // 格式: <{guid}.sps@{domain}> - "sps" 標記用於識別本系統發送的郵件
            var domain = fromEmail.Contains('@') ? fromEmail.Split('@')[1] : smtpServer;
            var messageId = $"{Guid.NewGuid()}.sps@{domain}";
            mailLog.MessageId = $"<{messageId}>";

            // 收集所有收件人用於日誌
            var allReceivers = new List<string> { option.To };
            if (option.Cc != null) allReceivers.AddRange(option.Cc);
            if (option.Bcc != null) allReceivers.AddRange(option.Bcc);

            mailLog.Receivers = string.Join(", ", allReceivers);
            mailLog.ReceiverCount = allReceivers.Count;

            // 使用 MailKit 發送郵件
            // 建立 MimeMessage
            var mimeMessage = new MimeMessage();
            mimeMessage.From.Add(new MailboxAddress(fromName, fromEmail));
            mimeMessage.To.Add(MailboxAddress.Parse(option.To));
            mimeMessage.Subject = option.Subject;
            mimeMessage.MessageId = messageId;

            // 添加 CC
            if (option.Cc != null)
            {
                foreach (var cc in option.Cc)
                {
                    mimeMessage.Cc.Add(MailboxAddress.Parse(cc));
                }
            }

            // 添加 BCC
            if (option.Bcc != null)
            {
                foreach (var bcc in option.Bcc)
                {
                    mimeMessage.Bcc.Add(MailboxAddress.Parse(bcc));
                }
            }

            // 建立郵件內容
            var bodyBuilder = new BodyBuilder();

            bodyBuilder.HtmlBody = option.Body;

            if (option.LinkedResources != null && option.LinkedResources.Count > 0)
            {
                // 有內嵌資源（如 Logo）
                foreach (var (cid, (stream, contentType)) in option.LinkedResources)
                {
                    var ms = new MemoryStream();
                    await stream.CopyToAsync(ms);
                    ms.Position = 0;
                    var resource = bodyBuilder.LinkedResources.Add(cid, ms.ToArray(), MimeKit.ContentType.Parse(contentType));
                    resource.ContentId = cid;
                }
            }

            if (option.Attachments != null && option.Attachments.Count > 0)
            {
                foreach (var att in option.Attachments)
                {
                    if (att.Content == null || att.Content.Length == 0) continue;
                    var ct = string.IsNullOrWhiteSpace(att.ContentType)
                        ? MimeKit.ContentType.Parse("application/octet-stream")
                        : MimeKit.ContentType.Parse(att.ContentType);
                    bodyBuilder.Attachments.Add(att.FileName ?? "attachment", att.Content, ct);
                }
            }

            mimeMessage.Body = bodyBuilder.ToMessageBody();

            // 重試邏輯：最多重試 3 次，處理暫時性錯誤
            const int maxRetries = 3;
            Exception? lastException = null;

            for (var attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    using var client = new SmtpClient();
                    client.Timeout = 30000; // 30 秒超時

                    // 根據 port 和 SSL 設定選擇連線方式
                    // Port 465 使用 implicit SSL (SslOnConnect)
                    // Port 587 使用 STARTTLS (StartTls)
                    // 其他情況根據 enableSsl 決定
                    SecureSocketOptions socketOptions;
                    if (smtpPort == 465)
                    {
                        socketOptions = SecureSocketOptions.SslOnConnect;
                    }
                    else if (smtpPort == 587)
                    {
                        socketOptions = enableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None;
                    }
                    else
                    {
                        socketOptions = enableSsl ? SecureSocketOptions.Auto : SecureSocketOptions.None;
                    }

                    await client.ConnectAsync(smtpServer, smtpPort, socketOptions);
                    await client.AuthenticateAsync(username, password);
                    await client.SendAsync(mimeMessage);
                    await client.DisconnectAsync(true);

                    lastException = null;
                    break; // 發送成功，跳出迴圈
                }
                catch (Exception ex) when (attempt < maxRetries && IsTransientMailKitError(ex))
                {
                    lastException = ex;
                    _logger.LogWarning("Email send attempt {Attempt} failed with transient error: {Message}. Retrying...",
                        attempt, ex.Message);
                    await Task.Delay(1000 * attempt); // 遞增延遲：1秒、2秒、3秒
                }
            }

            if (lastException != null)
            {
                throw lastException;
            }

            mailLog.IsSuccess = true;
            _logger.LogInformation($"Email sent successfully to {option.To}");
        }
        catch (Exception ex)
        {
            mailLog.IsSuccess = false;
            mailLog.ErrorMessage = ex.Message;
            _logger.LogError(ex, $"Failed to send email to {option.To}");
            throw new EmailServiceException("Failed to send email", ex);
        }
        finally
        {
            // 記錄郵件日誌
            try
            {
                _dbContext.Set<MailLog>().Add(mailLog);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception logEx)
            {
                _logger.LogError(logEx, "Failed to save mail log");
            }
        }
    }

    /// <summary>
    ///     發送驗證電子郵件。
    /// </summary>
    /// <param name="to">收件人電子郵件地址。</param>
    /// <param name="verificationLink">驗證連結。</param>
    public async Task SendVerificationEmailUrlAsync(string to, string verificationLink)
    {
        await SendTemplateEmailAsync(to, "verification_url", new Dictionary<string, string>
        {
            { "verificationLink", verificationLink }
        });
    }

    /// <summary>
    ///     發送電子郵件驗證碼。
    /// </summary>
    /// <param name="to">收件人電子郵件地址。</param>
    /// <param name="code">驗證碼。</param>
    /// <returns>如果郵件發送成功，則返回 true。</returns>
    public async Task<bool> SendVerificationEmailCodeAsync(string to, string code)
    {
        await SendTemplateEmailAsync(to, "verification_code", new Dictionary<string, string>
        {
            { "code", code },
            { "userName", to },
            { "expireMinutes", "5" }
        });
        return true;
    }

    /// <summary>
    ///     發送密碼重設郵件。
    /// </summary>
    /// <param name="to">收件人電子郵件地址。</param>
    /// <param name="resetLink">密碼重設連結。</param>
    public async Task SendPasswordResetEmailAsync(string to, string resetLink, string userName, int expireMinutes = 30)
    {
        await SendTemplateEmailAsync(to, "password_reset", new Dictionary<string, string>
        {
            { "resetLink", resetLink },
            { "userName", userName },
            { "expireMinutes", expireMinutes.ToString() }
        });
    }

    /// <summary>
    ///     發送組織域名驗證郵件。
    /// </summary>
    /// <param name="to">收件人電子郵件地址。</param>
    /// <param name="organizationName">組織名稱。</param>
    /// <param name="verificationToken">驗證令牌。</param>
    public async Task SendDomainVerificationEmailAsync(string to, string organizationName, string verificationToken)
    {
        await SendTemplateEmailAsync(to, "domain_verification", new Dictionary<string, string>
        {
            { "organizationName", organizationName },
            { "verificationToken", verificationToken }
        });
    }

    // ==================== 申請審核系統專用郵件 ====================

    /// <summary>
    /// 發送申請提交確認郵件（給申請人）
    /// </summary>
    public async Task SendApplicationSubmittedEmailAsync(string to, string applicationNumber, string contactName)
    {
        await SendTemplateEmailAsync(to, "application_submitted", new Dictionary<string, string>
        {
            { "contactName", contactName },
            { "applicationNumber", applicationNumber }
        });
    }

    /// <summary>
    /// 發送新申請通知郵件（給審核員）
    /// </summary>
    public async Task SendNewApplicationNotificationEmailAsync(string to, string applicationNumber, string applicantEmail)
    {
        await SendTemplateEmailAsync(to, "new_application_notification", new Dictionary<string, string>
        {
            { "applicationNumber", applicationNumber },
            { "applicantEmail", applicantEmail }
        });
    }

    /// <summary>
    /// 發送申請審核通過郵件（給申請人）
    /// </summary>
    public async Task SendApplicationApprovedEmailAsync(string to, string applicationNumber, string contactName, string loginUrl)
    {
        await SendTemplateEmailAsync(to, "application_approved", new Dictionary<string, string>
        {
            { "contactName", contactName },
            { "applicationNumber", applicationNumber },
            { "loginUrl", loginUrl }
        });
    }

    /// <summary>
    /// 發送申請審核拒絕郵件（給申請人）
    /// </summary>
    public async Task SendApplicationRejectedEmailAsync(string to, string applicationNumber, string contactName, string rejectionReason)
    {
        await SendTemplateEmailAsync(to, "application_rejected", new Dictionary<string, string>
        {
            { "contactName", contactName },
            { "applicationNumber", applicationNumber },
            { "rejectionReason", rejectionReason }
        });
    }

    /// <summary>
    /// 發送申請補件通知郵件（給申請人）
    /// </summary>
    public async Task SendApplicationDocumentRequiredEmailAsync(string to, string applicationNumber, string contactName, string requiredDocuments)
    {
        await SendTemplateEmailAsync(to, "application_document_required", new Dictionary<string, string>
        {
            { "contactName", contactName },
            { "applicationNumber", applicationNumber },
            { "requiredDocuments", requiredDocuments }
        });
    }

    /// <summary>
    /// 判斷是否為暫時性錯誤（可重試）
    /// </summary>
    private static bool IsTransientError(SmtpException ex)
    {
        // 5xx 錯誤中，某些是暫時性的
        // 421: Service not available, closing transmission channel
        // 450: Requested action not taken – mailbox unavailable (busy)
        // 451: Requested action aborted – local error in processing
        // 452: Requested action not taken – insufficient system storage
        // 4xx 系列通常都是暫時性錯誤

        var message = ex.Message.ToLower();

        // 檢查常見的暫時性錯誤訊息
        if (message.Contains("timeout") ||
            message.Contains("connection") ||
            message.Contains("try again") ||
            message.Contains("temporarily") ||
            message.Contains("busy") ||
            message.Contains("unavailable") ||
            message.Contains("service not available"))
        {
            return true;
        }

        // SmtpStatusCode 判斷
        return ex.StatusCode switch
        {
            System.Net.Mail.SmtpStatusCode.ServiceNotAvailable => true,        // 421
            System.Net.Mail.SmtpStatusCode.MailboxBusy => true,                // 450
            System.Net.Mail.SmtpStatusCode.LocalErrorInProcessing => true,     // 451
            System.Net.Mail.SmtpStatusCode.InsufficientStorage => true,        // 452
            System.Net.Mail.SmtpStatusCode.ServiceClosingTransmissionChannel => true, // 421
            _ => false
        };
    }

    /// <summary>
    /// 判斷 MailKit 錯誤是否為暫時性錯誤（可重試）
    /// </summary>
    private static bool IsTransientMailKitError(Exception ex)
    {
        var message = ex.Message.ToLower();

        // 檢查常見的暫時性錯誤訊息
        if (message.Contains("timeout") ||
            message.Contains("connection") ||
            message.Contains("try again") ||
            message.Contains("temporarily") ||
            message.Contains("busy") ||
            message.Contains("unavailable") ||
            message.Contains("service not available"))
        {
            return true;
        }

        // MailKit 特定的暫時性錯誤
        if (ex is MailKit.Net.Smtp.SmtpCommandException smtpEx)
        {
            // 4xx 系列通常是暫時性錯誤
            var statusCode = (int)smtpEx.StatusCode;
            return statusCode >= 400 && statusCode < 500;
        }

        // 連線相關錯誤通常可以重試
        if (ex is System.IO.IOException || ex is System.Net.Sockets.SocketException)
        {
            return true;
        }

        return false;
    }

    /// <summary>
    ///     配置伺服器憑證驗證回調。
    /// </summary>
    private void ConfigureServerCertificateValidation()
    {
#pragma warning disable SYSLIB0014 // ServicePointManager is obsolete, but still needed for legacy SSL validation
        ServicePointManager.ServerCertificateValidationCallback = (sender, cert, chain, sslPolicyErrors) =>
        {
            if (sslPolicyErrors == SslPolicyErrors.None)
                return true;
            _logger.LogError($"[SMTP 憑證錯誤]：{sslPolicyErrors}");
            Console.WriteLine($"[SMTP 憑證錯誤]：{sslPolicyErrors}");
            return false;
        };
#pragma warning restore SYSLIB0014
    }

    /// <inheritdoc />
    public Task<(string Html, Dictionary<string, (Stream Stream, string ContentType)>? LinkedResources)> WrapWithLayoutAsync(string title, string content)
        => GenerateEmailTemplateAsync(title, content);

    /// <inheritdoc />
    public Task<string> WrapWithLayoutForPreviewAsync(string title, string content, string baseUrl)
        => GenerateEmailTemplateForPreviewAsync(title, content, baseUrl);

    /// <summary>
    /// 發送範本郵件
    /// </summary>
    public async Task SendTemplateEmailAsync(string to, string templateKey, Dictionary<string, string> variables)
    {
        var (subject, body) = await GetTemplateContentAsync(templateKey, variables);
        var (html, resources) = await GenerateEmailTemplateAsync(subject, body);

        var option = new EmailOption
        {
            To = to,
            Subject = subject,
            Body = html,
            LinkedResources = resources
        };

        await SendEmailAsync(option);
    }

    /// <summary>
    /// 從系統設定讀取範本內容
    /// </summary>
    private async Task<(string Subject, string Body)> GetTemplateContentAsync(string templateKey, Dictionary<string, string> variables)
    {
        try
        {
            var result = await _systemSettingService.GetSettingAsync<EmailTemplateSettingsDto>("EmailTemplates");
            if (result.IsSuccess && result.Data?.Templates != null)
            {
                var template = result.Data.Templates.FirstOrDefault(t => t.Key == templateKey && t.IsActive);
                if (template != null)
                {
                    var subject = template.Subject;
                    var body = template.HtmlContent;

                    // 替換變數
                    foreach (var (key, value) in variables)
                    {
                        subject = subject.Replace($"{{{{{key}}}}}", value);
                        body = body.Replace($"{{{{{key}}}}}", value);
                    }

                    return (subject, body);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load email template from settings, using default template for {TemplateKey}", templateKey);
        }

        // 如果無法從設定讀取，使用預設範本
        return GetDefaultTemplateContent(templateKey, variables);
    }

    /// <summary>
    /// 發送密碼變更通知郵件
    /// </summary>
    public async Task SendPasswordChangedEmailAsync(string to, string userName, string changeTime, string ipAddress)
    {
        await SendTemplateEmailAsync(to, "password_changed", new Dictionary<string, string>
        {
            { "userName", userName },
            { "changeTime", changeTime },
            { "ipAddress", ipAddress }
        });
    }

    public async Task SendDemandMatchNotificationEmailAsync(string to, string demandName, string demandIntroduction, List<string> tagNames, string? bcc = null, CancellationToken ct = default)
    {
        var tagsHtml = tagNames.Count > 0
            ? string.Join("", tagNames.Select(t =>
                $"<span style='display:inline-block;background:#e3f2fd;color:#1565c0;border-radius:4px;padding:2px 10px;margin:2px;font-size:13px;'>{System.Net.WebUtility.HtmlEncode(t)}</span>"))
            : "（無標籤）";

        var (subject, body) = await GetTemplateContentAsync("demand_match_notification", new Dictionary<string, string>
        {
            ["demandName"] = System.Net.WebUtility.HtmlEncode(demandName),
            ["demandIntroduction"] = string.IsNullOrWhiteSpace(demandIntroduction)
                ? ""
                : System.Net.WebUtility.HtmlEncode(demandIntroduction),
            ["demandTags"] = tagsHtml
        });
        var (html, resources) = await GenerateEmailTemplateAsync(subject, body);

        var option = new EmailOption
        {
            To = to,
            Subject = subject,
            Body = html,
            LinkedResources = resources,
            Bcc = string.IsNullOrWhiteSpace(bcc) ? null : [bcc]
        };

        await SendEmailAsync(option);
    }

    /// <summary>
    /// 獲取預設範本內容
    /// </summary>
    private (string Subject, string Body) GetDefaultTemplateContent(string templateKey, Dictionary<string, string> variables)
    {
        var (subject, body) = templateKey switch
        {
            "verification_code" => (
                "電子郵件驗證碼 - 智慧石化產業資訊暨媒合平台",
                @"<p>親愛的 {{userName}}，您好！</p>
<p>您正在進行電子郵件驗證，請使用以下驗證碼完成流程：</p>
<div style='background-color: #f8f9fa; border-left: 4px solid #4285f4; padding: 16px; margin: 20px 0; font-family: monospace; font-size: 24px; text-align: center; letter-spacing: 5px;'>{{code}}</div>
<p>此驗證碼將在 {{expireMinutes}} 分鐘內有效。</p>"
            ),
            "password_changed" => (
                "密碼已變更 - 智慧石化產業資訊暨媒合平台",
                @"<p>親愛的 {{userName}}，您好！</p>
<p>您的密碼已於 {{changeTime}} 成功變更。</p>
<p>變更 IP 地址：{{ipAddress}}</p>
<p>如果這不是您本人的操作，請立即聯繫系統管理員。</p>"
            ),
            "welcome" => (
                "歡迎加入 - 智慧石化產業資訊暨媒合平台",
                @"<p>親愛的 {{userName}}，您好！</p>
<p>歡迎加入智慧石化產業資訊暨媒合平台！</p>
<p>您現在可以登入系統開始使用各項服務。</p>
<p><a href='{{loginUrl}}' style='display: inline-block; background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;'>立即登入</a></p>"
            ),
            "application_submitted" => (
                "申請已提交 - 智慧石化產業資訊暨媒合平台",
                @"<p style='margin-bottom: 16px;'>親愛的 {{contactName}}，您好！</p>
<p style='margin-bottom: 16px;'>感謝您提交會員申請。您的申請已成功提交至系統。</p>
<div style='background-color: #f8f9fa; border-left: 4px solid #4285f4; padding: 16px; margin: 20px 0;'>
    <strong>申請編號：</strong>{{applicationNumber}}
</div>
<p style='margin-bottom: 16px;'>我們的審核團隊將盡快處理您的申請。審核結果將通過電子郵件通知您。</p>
<p style='margin-bottom: 16px;'>審核過程通常需要 1-3 個工作日，請耐心等待。</p>
<p style='margin-bottom: 16px;'>如有任何問題，請隨時與我們聯繫。</p>"
            ),
            "application_approved" => (
                "申請已通過 - 智慧石化產業資訊暨媒合平台",
                @"<p style='margin-bottom: 16px;'>親愛的 {{contactName}}，您好！</p>
<p style='margin-bottom: 16px;'>恭喜！您的會員申請已通過審核。</p>
<div style='background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 16px; margin: 20px 0;'>
    <strong>申請編號：</strong>{{applicationNumber}}<br>
    <strong>審核結果：</strong><span style='color: #4caf50; font-weight: bold;'>通過</span>
</div>
<p style='margin-bottom: 16px;'>您現在可以使用註冊時填寫的郵箱和密碼登入系統。</p>
<p><a href='{{loginUrl}}' style='display: inline-block; background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;'>立即登入</a></p>
<p style='margin-top: 20px; margin-bottom: 16px;'>歡迎加入智慧石化產業資訊暨媒合平台！</p>"
            ),
            "application_rejected" => (
                "申請未通過 - 智慧石化產業資訊暨媒合平台",
                @"<p style='margin-bottom: 16px;'>親愛的 {{contactName}}，您好！</p>
<p style='margin-bottom: 16px;'>很抱歉，您的會員申請未能通過審核。</p>
<div style='background-color: #ffebee; border-left: 4px solid #f44336; padding: 16px; margin: 20px 0;'>
    <strong>申請編號：</strong>{{applicationNumber}}<br>
    <strong>審核結果：</strong><span style='color: #f44336; font-weight: bold;'>未通過</span>
</div>
<div style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 20px 0;'>
    <strong>拒絕原因：</strong><br>
    {{rejectionReason}}
</div>
<p style='margin-bottom: 16px;'>如對審核結果有疑問，歡迎與我們聯繫。</p>
<p style='margin-bottom: 16px;'>您可以在修正相關問題後重新提交申請。</p>"
            ),
            "application_document_required" => (
                "申請補件通知 - 智慧石化產業資訊暨媒合平台",
                @"<p style='margin-bottom: 16px;'>親愛的 {{contactName}}，您好！</p>
<p style='margin-bottom: 16px;'>您的會員申請需要補充文件。</p>
<div style='background-color: #f8f9fa; border-left: 4px solid #4285f4; padding: 16px; margin: 20px 0;'>
    <strong>申請編號：</strong>{{applicationNumber}}
</div>
<div style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 20px 0;'>
    <strong>需補充文件：</strong><br>
    {{requiredDocuments}}
</div>
<p style='margin-bottom: 16px;'>請盡快補充所需文件，以便我們繼續處理您的申請。</p>"
            ),
            "new_application_notification" => (
                "新會員申請通知 - 智慧石化產業資訊暨媒合平台",
                @"<p style='margin-bottom: 16px;'>您好！</p>
<p style='margin-bottom: 16px;'>系統收到一筆新的會員申請，請至後台審核。</p>
<div style='background-color: #f8f9fa; border-left: 4px solid #4285f4; padding: 16px; margin: 20px 0;'>
    <strong>申請編號：</strong>{{applicationNumber}}<br>
    <strong>申請人信箱：</strong>{{applicantEmail}}
</div>"
            ),
            "password_reset" => (
                "密碼重設請求 - 智慧石化產業資訊暨媒合平台",
                @"<p style='margin-bottom: 16px;'>親愛的 {{userName}}，您好！</p>
<p style='margin-bottom: 16px;'>我們收到了您的密碼重設請求。請點擊下方按鈕來重設您的密碼。此連結將在 {{expireMinutes}} 分鐘後失效。</p>
<div style='text-align: center; margin: 24px 0;'>
    <a href='{{resetLink}}' style='display: inline-block; background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold;'>重設密碼</a>
</div>
<p style='margin-bottom: 16px;'>如果這不是您發起的請求，請忽略此郵件並確保您的帳號安全。</p>"
            ),
            "verification_url" => (
                "驗證您的電子郵件地址 - 智慧石化產業資訊暨媒合平台",
                @"<p style='margin-bottom: 16px;'>您好，</p>
<p style='margin-bottom: 16px;'>請點擊下方按鈕來驗證您的電子郵件地址。此驗證連結將在 24 小時後失效。</p>
<div style='text-align: center; margin: 24px 0;'>
    <a href='{{verificationLink}}' style='display: inline-block; background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold;'>驗證電子郵件</a>
</div>
<p style='margin-bottom: 16px;'>如果您沒有註冊帳號，請忽略此郵件。</p>"
            ),
            "domain_verification" => (
                "域名驗證 - 智慧石化產業資訊暨媒合平台",
                @"<p style='margin-bottom: 16px;'>您好，</p>
<p style='margin-bottom: 16px;'>您的組織 {{organizationName}} 已請求域名驗證。請使用以下驗證令牌來完成域名驗證流程：</p>
<div style='background-color: #f8f9fa; border-left: 4px solid #4285f4; padding: 16px; margin: 20px 0; font-family: monospace; font-size: 18px; text-align: center; word-break: break-all;'>{{verificationToken}}</div>
<p style='margin-bottom: 16px;'>請將此令牌添加到您的域名 DNS TXT 記錄中以完成驗證。</p>"
            ),
            "demand_match_notification" => (
                "解決方案媒合需求-智慧石化計畫輔導轉介",
                @"<p>您好，本計畫執行產業智慧安全升級輔導，近日有受輔導業者經過建議，綜整導入需求/建議如下。</p>
<div style='background:#f8f9fa;border-left:4px solid #1976d2;padding:16px;margin:16px 0;'>
  <h3 style='margin:0 0 8px;color:#1976d2;'>{{demandName}}</h3>
  <p style='white-space:pre-line;'>{{demandIntroduction}}</p>
</div>
<p>根據貴司在媒合平台所登載的技術服務項目與智慧技術標籤，專業顧問團隊評估後認為，貴司擁有的技術方案與此需求高度契合。</p>
<p>因此，誠摯邀請貴司參閱上述需求，並於此統之後一週內提供對應的智慧化解決方案相關資訊（如簡介、案例等），以利後續媒合及廠方評估。若廠方對方案有進一步興趣，我們將立即安排雙方進廠進行細部規劃討論。</p>
<p>如有任何問題歡迎隨時與我們聯繫。感謝貴司的協助與支持。</p>
<p>聯繫資訊：<a href='mailto:exyway13@mail.isha.org.tw'>exyway13@mail.isha.org.tw</a>、07-5503115#22 潘恆毅副工程師</p>
<div style='margin-top:16px;'><strong>需求標籤：</strong><br>{{demandTags}}</div>"
            ),
            _ => ($"系統通知 - 智慧石化產業資訊暨媒合平台", "<p>您有一則新的系統通知。</p>")
        };

        // 替換變數
        foreach (var (key, value) in variables)
        {
            subject = subject.Replace($"{{{{{key}}}}}", value);
            body = body.Replace($"{{{{{key}}}}}", value);
        }

        return (subject, body);
    }

    /// <summary>
    ///     產生電子郵件 HTML 模板（從 SystemSettings 讀取版面配置）。
    /// </summary>
    private async Task<(string Html, Dictionary<string, (Stream Stream, string ContentType)>? LinkedResources)> GenerateEmailTemplateAsync(string title, string content)
    {
        var layout = await GetEmailLayoutSettingsAsync();
        Dictionary<string, (Stream, string)>? linkedResources = null;

        // 嘗試從 FileManagement 下載 Logo 並以 CID 嵌入
        var logoSrc = "";
        if (!string.IsNullOrEmpty(layout.LogoUrl))
        {
            // 從 URL 解析 FileManagement GUID: /api/FileManagement/{guid}/download
            var match = System.Text.RegularExpressions.Regex.Match(
                layout.LogoUrl, @"/api/FileManagement/([0-9a-fA-F\-]+)/download");
            if (match.Success && Guid.TryParse(match.Groups[1].Value, out var fileId))
            {
                try
                {
                    var result = await _fileManagementService.DownloadFileAsync(fileId, CancellationToken.None);
                    if (result.IsSuccess)
                    {
                        // 將 stream 複製到 MemoryStream 以便重複使用
                        var ms = new MemoryStream();
                        await result.Data.FileStream.CopyToAsync(ms);
                        ms.Position = 0;

                        linkedResources = new Dictionary<string, (Stream, string)>
                        {
                            ["email-logo"] = (ms, result.Data.ContentType)
                        };
                        logoSrc = "cid:email-logo";
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to load logo file for email, skipping logo");
                }
            }
            else if (layout.LogoUrl.StartsWith("http"))
            {
                // 外部 URL 直接使用
                logoSrc = layout.LogoUrl;
            }
        }

        var footerHtml = !string.IsNullOrEmpty(layout.FooterHtml)
            ? layout.FooterHtml
            : "此郵件由系統自動發送，請勿直接回覆。如有問題，請聯繫系統管理員。";

        var copyrightSection = !string.IsNullOrEmpty(layout.CopyrightText)
            ? $"<p style='color: {layout.FooterColor}; font-size: 11px; margin-top: 8px;'>{layout.CopyrightText}</p>"
            : "";

        var logoSection = !string.IsNullOrEmpty(logoSrc)
            ? $@"<div style='text-align: center; margin-top: 20px;'>
            <img src='{logoSrc}' alt='{layout.PlatformName}' style='max-width: {layout.LogoMaxWidthPercent}%; height: auto;' />
        </div>"
            : "";

        var html = @$"
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <title>{title}</title>
    </head>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);'>
            <h2 style='color: {layout.PrimaryColor}; margin-bottom: 20px;'>{title}</h2>
            <div style='color: {layout.ContentColor};'>
                {content}
            </div>
            <hr style='margin: 20px 0; border: none; border-top: 1px solid #eee;'>
            <p style='color: {layout.FooterColor}; font-size: 12px;'>
                {footerHtml}
            </p>
            {copyrightSection}
        </div>
        {logoSection}
    </body>
    </html>";

        return (html, linkedResources);
    }

    /// <summary>
    ///     產生電子郵件 HTML 模板用於瀏覽器預覽（使用實際 URL 而非 CID）。
    ///     此方法會模擬實際郵件的顯示效果。
    /// </summary>
    private async Task<string> GenerateEmailTemplateForPreviewAsync(string title, string content, string baseUrl)
    {
        var layout = await GetEmailLayoutSettingsAsync();

        // 處理 Logo URL - 轉換為完整 URL 供瀏覽器預覽使用
        var logoSrc = "";
        if (!string.IsNullOrEmpty(layout.LogoUrl))
        {
            if (layout.LogoUrl.StartsWith("http"))
            {
                // 已是完整 URL
                logoSrc = layout.LogoUrl;
            }
            else if (layout.LogoUrl.StartsWith("/"))
            {
                // 相對路徑，加上 baseUrl
                logoSrc = baseUrl.TrimEnd('/') + layout.LogoUrl;
            }
            else
            {
                // 其他格式，嘗試當作相對路徑處理
                logoSrc = baseUrl.TrimEnd('/') + "/" + layout.LogoUrl;
            }
        }

        var footerHtml = !string.IsNullOrEmpty(layout.FooterHtml)
            ? layout.FooterHtml
            : "此郵件由系統自動發送，請勿直接回覆。如有問題，請聯繫系統管理員。";

        var copyrightSection = !string.IsNullOrEmpty(layout.CopyrightText)
            ? $"<p style='color: {layout.FooterColor}; font-size: 11px; margin-top: 8px;'>{layout.CopyrightText}</p>"
            : "";

        // 計算 Logo 的實際最大寬度（基於 600px 郵件寬度，模擬實際郵件效果）
        var logoMaxWidth = (int)(600 * layout.LogoMaxWidthPercent / 100);
        var logoSection = !string.IsNullOrEmpty(logoSrc)
            ? $@"<div style='text-align: center; margin-top: 20px;'>
            <img src='{logoSrc}' alt='{layout.PlatformName}' style='display: block; margin: 0 auto; max-width: {logoMaxWidth}px; height: auto;' />
        </div>"
            : "";

        // 使用外層容器限制寬度，模擬郵件客戶端的顯示效果
        var html = @$"
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <title>{title}</title>
    </head>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f5f5f5;'>
        <div style='max-width: 600px; margin: 0 auto;'>
            <div style='background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);'>
                <h2 style='color: {layout.PrimaryColor}; margin-bottom: 20px;'>{title}</h2>
                <div style='color: {layout.ContentColor};'>
                    {content}
                </div>
                <hr style='margin: 20px 0; border: none; border-top: 1px solid #eee;'>
                <p style='color: {layout.FooterColor}; font-size: 12px;'>
                    {footerHtml}
                </p>
                {copyrightSection}
            </div>
            {logoSection}
        </div>
    </body>
    </html>";

        return html;
    }

    /// <summary>
    /// 從 SystemSettings 讀取郵件版面配置，失敗時回傳預設值
    /// </summary>
    private async Task<EmailLayoutSettingsDto> GetEmailLayoutSettingsAsync()
    {
        try
        {
            var result = await _systemSettingService
                .GetSettingAsync<EmailLayoutSettingsDto>("EmailLayout");

            if (result.IsSuccess && result.Data != null)
                return result.Data;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load email layout settings, using defaults");
        }

        return new EmailLayoutSettingsDto();
    }
}