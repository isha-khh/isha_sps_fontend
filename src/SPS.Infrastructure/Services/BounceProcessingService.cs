using System.Text.RegularExpressions;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MimeKit;
using SPS.Application.DTOs.SystemSettings;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 退信處理服務 - 使用 IMAP 讀取並處理退信郵件
/// </summary>
public class BounceProcessingService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BounceProcessingService> _logger;

    public BounceProcessingService(ApplicationDbContext context, ILogger<BounceProcessingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 連接 IMAP 並處理退信郵件
    /// </summary>
    public async Task<BounceProcessingResult> ProcessBouncesAsync(
        BounceMailSettingsDto settings,
        CancellationToken ct = default)
    {
        var result = new BounceProcessingResult();

        if (!settings.Enabled)
        {
            _logger.LogDebug("退信處理已停用");
            return result;
        }

        try
        {
            using var client = new ImapClient();

            // 連接 IMAP 伺服器
            await client.ConnectAsync(
                settings.ImapServer,
                settings.ImapPort,
                settings.UseSsl,
                ct);

            _logger.LogDebug("已連接到 IMAP 伺服器: {Server}:{Port}", settings.ImapServer, settings.ImapPort);

            // 認證
            await client.AuthenticateAsync(settings.Username, settings.Password, ct);
            _logger.LogDebug("IMAP 認證成功");

            // 開啟信箱資料夾
            var folder = await client.GetFolderAsync(settings.Folder, ct);
            await folder.OpenAsync(FolderAccess.ReadWrite, ct);

            _logger.LogDebug("已開啟資料夾: {Folder}, 郵件數: {Count}", settings.Folder, folder.Count);

            // 搜尋退信郵件（DSN 或包含特定主旨的郵件）
            var query = SearchQuery.Or(
                SearchQuery.SubjectContains("Undelivered"),
                SearchQuery.Or(
                    SearchQuery.SubjectContains("Delivery Status Notification"),
                    SearchQuery.Or(
                        SearchQuery.SubjectContains("Mail delivery failed"),
                        SearchQuery.Or(
                            SearchQuery.SubjectContains("Returned mail"),
                            SearchQuery.SubjectContains("failure notice")
                        )
                    )
                )
            );

            var uids = await folder.SearchAsync(query, ct);
            result.TotalFound = uids.Count;

            _logger.LogInformation("找到 {Count} 封可能的退信郵件", uids.Count);

            // 準備處理後移動的目標資料夾
            IMailFolder? processedFolder = null;
            if (!settings.DeleteAfterProcessing && !string.IsNullOrEmpty(settings.MoveToFolder))
            {
                try
                {
                    processedFolder = await client.GetFolderAsync(settings.MoveToFolder, ct);
                }
                catch
                {
                    // 資料夾不存在，嘗試建立
                    try
                    {
                        var rootFolder = client.GetFolder(client.PersonalNamespaces[0]);
                        processedFolder = await rootFolder.CreateAsync(settings.MoveToFolder, true, ct);
                        _logger.LogInformation("已建立資料夾: {Folder}", settings.MoveToFolder);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "無法建立資料夾 {Folder}", settings.MoveToFolder);
                    }
                }
            }

            // 處理每封退信
            var processedUids = new List<UniqueId>();
            foreach (var uid in uids)
            {
                try
                {
                    var message = await folder.GetMessageAsync(uid, ct);
                    var processed = await ProcessBounceMessageAsync(message, ct);

                    if (processed)
                    {
                        result.ProcessedCount++;
                        processedUids.Add(uid);
                    }
                    else
                    {
                        result.SkippedCount++;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "處理郵件 {Uid} 時發生錯誤", uid);
                    result.ErrorCount++;
                }
            }

            // 移動或刪除已處理的郵件
            if (processedUids.Count > 0)
            {
                if (settings.DeleteAfterProcessing)
                {
                    await folder.AddFlagsAsync(processedUids, MessageFlags.Deleted, true, ct);
                    await folder.ExpungeAsync(ct);
                    _logger.LogInformation("已刪除 {Count} 封已處理的退信", processedUids.Count);
                }
                else if (processedFolder != null)
                {
                    await folder.MoveToAsync(processedUids, processedFolder, ct);
                    _logger.LogInformation("已移動 {Count} 封已處理的退信到 {Folder}",
                        processedUids.Count, settings.MoveToFolder);
                }
            }

            await client.DisconnectAsync(true, ct);

            _logger.LogInformation("退信處理完成: 找到={Total}, 處理={Processed}, 跳過={Skipped}, 錯誤={Errors}",
                result.TotalFound, result.ProcessedCount, result.SkippedCount, result.ErrorCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "退信處理服務發生錯誤");
            result.Error = ex.Message;
        }

        return result;
    }

    /// <summary>
    /// 處理單封退信郵件
    /// </summary>
    private async Task<bool> ProcessBounceMessageAsync(MimeMessage message, CancellationToken ct)
    {
        var bounceInfo = ParseBounceMessage(message);

        if (bounceInfo == null)
        {
            _logger.LogDebug("無法解析退信: {Subject}", message.Subject);
            return false;
        }

        // 檢查是否為本系統發送的郵件
        if (!IsFromOurSystem(bounceInfo.OriginalMessageId))
        {
            _logger.LogDebug("非本系統郵件: {MessageId}", bounceInfo.OriginalMessageId);
            return false;
        }

        // 查找對應的郵件記錄
        MailLog? mailLog = null;

        if (!string.IsNullOrEmpty(bounceInfo.OriginalMessageId))
        {
            mailLog = await _context.Set<MailLog>()
                .FirstOrDefaultAsync(m => m.MessageId == bounceInfo.OriginalMessageId, ct);
        }

        if (mailLog == null && !string.IsNullOrEmpty(bounceInfo.FinalRecipient))
        {
            // 用收件人查找最近 7 天內的郵件
            var cutoff = DateTime.UtcNow.AddDays(-7);
            mailLog = await _context.Set<MailLog>()
                .Where(m => m.Receivers != null &&
                            m.Receivers.Contains(bounceInfo.FinalRecipient) &&
                            m.CreatedTime >= cutoff &&
                            m.BounceStatus == BounceStatus.None)
                .OrderByDescending(m => m.CreatedTime)
                .FirstOrDefaultAsync(ct);
        }

        if (mailLog == null)
        {
            _logger.LogDebug("找不到對應的郵件記錄: {Recipient}", bounceInfo.FinalRecipient);
            return false;
        }

        // 檢查是否已處理過
        if (mailLog.BounceStatus != BounceStatus.None)
        {
            _logger.LogDebug("郵件已標記為退信: {Id}", mailLog.Id);
            return true; // 視為已處理
        }

        // 更新退信資訊
        mailLog.BounceStatus = bounceInfo.IsHardBounce ? BounceStatus.HardBounce : BounceStatus.SoftBounce;
        mailLog.BounceCode = bounceInfo.StatusCode;
        mailLog.BounceReason = bounceInfo.DiagnosticCode;
        mailLog.BounceTime = bounceInfo.ArrivalDate ?? DateTime.UtcNow;
        mailLog.RemoteMta = bounceInfo.RemoteMta;

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("已記錄退信: MailLogId={Id}, Recipient={Recipient}, Code={Code}",
            mailLog.Id, bounceInfo.FinalRecipient, bounceInfo.StatusCode);

        return true;
    }

    /// <summary>
    /// 解析 MimeMessage 中的退信資訊
    /// </summary>
    private BounceInfo? ParseBounceMessage(MimeMessage message)
    {
        var info = new BounceInfo
        {
            ArrivalDate = message.Date.UtcDateTime
        };

        // 嘗試從 DSN (Delivery Status Notification) 部分解析
        foreach (var part in message.BodyParts)
        {
            if (part is MessageDeliveryStatus deliveryStatus)
            {
                foreach (var group in deliveryStatus.StatusGroups)
                {
                    // 第一個群組是 per-message 欄位
                    // 後續群組是 per-recipient 欄位
                    foreach (var header in group)
                    {
                        switch (header.Field.ToLower())
                        {
                            case "final-recipient":
                                var recipientValue = header.Value;
                                if (recipientValue.StartsWith("rfc822;", StringComparison.OrdinalIgnoreCase))
                                    recipientValue = recipientValue.Substring(7).Trim();
                                info.FinalRecipient = recipientValue;
                                break;
                            case "status":
                                info.StatusCode = header.Value.Trim();
                                break;
                            case "remote-mta":
                                var mtaValue = header.Value;
                                if (mtaValue.StartsWith("dns;", StringComparison.OrdinalIgnoreCase))
                                    mtaValue = mtaValue.Substring(4).Trim();
                                info.RemoteMta = mtaValue;
                                break;
                            case "diagnostic-code":
                                info.DiagnosticCode = header.Value.Trim();
                                break;
                            case "original-message-id":
                                info.OriginalMessageId = header.Value.Trim();
                                break;
                        }
                    }
                }
            }
            else if (part is MessagePart messagePart)
            {
                // 附件的原始郵件
                var originalMessage = messagePart.Message;
                if (originalMessage != null && string.IsNullOrEmpty(info.OriginalMessageId))
                {
                    info.OriginalMessageId = originalMessage.MessageId;
                    if (!string.IsNullOrEmpty(originalMessage.MessageId) && !originalMessage.MessageId.StartsWith("<"))
                    {
                        info.OriginalMessageId = $"<{originalMessage.MessageId}>";
                    }
                }
            }
        }

        // 如果 DSN 解析失敗，嘗試從郵件文字內容解析
        if (string.IsNullOrEmpty(info.FinalRecipient))
        {
            var textBody = message.TextBody ?? message.HtmlBody ?? "";
            info = ParseFromTextContent(textBody, info);
        }

        // 判斷是否為硬退信（5xx 開頭）
        info.IsHardBounce = info.StatusCode?.StartsWith("5") ??
                           info.DiagnosticCode?.Contains("5.") ?? false;

        // 如果沒有解析到收件人，視為無效
        if (string.IsNullOrEmpty(info.FinalRecipient))
            return null;

        return info;
    }

    /// <summary>
    /// 從文字內容解析退信資訊
    /// </summary>
    private BounceInfo ParseFromTextContent(string content, BounceInfo info)
    {
        // 解析 Final-Recipient
        if (string.IsNullOrEmpty(info.FinalRecipient))
        {
            var recipientMatch = Regex.Match(content,
                @"(?:Final-Recipient|To|Recipient):\s*(?:RFC822;|rfc822;)?\s*<?([^\s<>\r\n]+@[^\s<>\r\n]+)>?",
                RegexOptions.IgnoreCase);
            if (recipientMatch.Success)
                info.FinalRecipient = recipientMatch.Groups[1].Value.Trim();
        }

        // 解析 Status
        if (string.IsNullOrEmpty(info.StatusCode))
        {
            var statusMatch = Regex.Match(content, @"Status:\s*(\d+\.\d+\.\d+)", RegexOptions.IgnoreCase);
            if (statusMatch.Success)
                info.StatusCode = statusMatch.Groups[1].Value;
        }

        // 解析 Remote-MTA
        if (string.IsNullOrEmpty(info.RemoteMta))
        {
            var mtaMatch = Regex.Match(content,
                @"Remote-MTA:\s*(?:DNS;|dns;)?\s*([^\s\r\n]+)",
                RegexOptions.IgnoreCase);
            if (mtaMatch.Success)
                info.RemoteMta = mtaMatch.Groups[1].Value.Trim();
        }

        // 解析 Diagnostic-Code
        if (string.IsNullOrEmpty(info.DiagnosticCode))
        {
            var diagMatch = Regex.Match(content,
                @"Diagnostic-Code:\s*(?:SMTP;)?\s*(.+?)(?=\r?\n[A-Z]|\r?\n\r?\n|$)",
                RegexOptions.IgnoreCase | RegexOptions.Singleline);
            if (diagMatch.Success)
                info.DiagnosticCode = diagMatch.Groups[1].Value.Trim()
                    .Replace("\r\n", " ").Replace("\n", " ");
        }

        // 解析 Original-Message-ID
        if (string.IsNullOrEmpty(info.OriginalMessageId))
        {
            var msgIdMatch = Regex.Match(content,
                @"(?:Original-)?Message-ID:\s*(<[^>]+\.sps@[^>]+>)",
                RegexOptions.IgnoreCase);
            if (msgIdMatch.Success)
                info.OriginalMessageId = msgIdMatch.Groups[1].Value;
        }

        return info;
    }

    /// <summary>
    /// 檢查 Message-ID 是否為本系統發送的郵件
    /// </summary>
    private bool IsFromOurSystem(string? messageId)
    {
        if (string.IsNullOrEmpty(messageId))
            return false;

        // 檢查 .sps@ 標記
        return messageId.Contains(".sps@", StringComparison.OrdinalIgnoreCase);
    }

    private class BounceInfo
    {
        public string? FinalRecipient { get; set; }
        public string? StatusCode { get; set; }
        public string? RemoteMta { get; set; }
        public string? DiagnosticCode { get; set; }
        public string? OriginalMessageId { get; set; }
        public DateTime? ArrivalDate { get; set; }
        public bool IsHardBounce { get; set; }
    }
}

/// <summary>
/// 退信處理結果
/// </summary>
public class BounceProcessingResult
{
    public int TotalFound { get; set; }
    public int ProcessedCount { get; set; }
    public int SkippedCount { get; set; }
    public int ErrorCount { get; set; }
    public string? Error { get; set; }
    public bool Success => string.IsNullOrEmpty(Error);
}
