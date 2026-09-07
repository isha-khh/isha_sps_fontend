using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.MailCampaign;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Infrastructure.Data;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace SPS.Infrastructure.Services;

public class MailCampaignService : IMailCampaignService
{
    private const int BatchSize = 50;
    private const int PerRecipientHardCap = 5000; // Slice 5: 排程化後上限放寬，但仍保留上限避免一次寫入過多 row
    private const string MailTypeBulk = "BulkBroadcast";
    private const string MailTypePersonalized = "BulkPersonalized";

    private static readonly Regex VariablePattern = new(@"\{\{\s*(?<key>[A-Za-z][A-Za-z0-9_]*)\s*\}\}", RegexOptions.Compiled);

    private readonly ApplicationDbContext _db;
    private readonly IEmailService _emailService;
    private readonly IFileManagementService _fileManagementService;
    private readonly ILogger<MailCampaignService> _logger;

    public MailCampaignService(
        ApplicationDbContext db,
        IEmailService emailService,
        IFileManagementService fileManagementService,
        ILogger<MailCampaignService> logger)
    {
        _db = db;
        _emailService = emailService;
        _fileManagementService = fileManagementService;
        _logger = logger;
    }

    // ==================== Public：佇列、處理、查詢、取消 ====================

    public async Task<Result<EnqueueCampaignResponse>> EnqueueAsync(
        SendCampaignRequest request,
        string? operatorId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Subject))
            return Result<EnqueueCampaignResponse>.Failure("主旨不可為空");
        if (string.IsNullOrWhiteSpace(request.Body))
            return Result<EnqueueCampaignResponse>.Failure("內容不可為空");
        if (!request.Broadcast
            && (request.CompanyIds?.Count ?? 0) == 0
            && (request.MemberIds?.Count ?? 0) == 0)
            return Result<EnqueueCampaignResponse>.Failure("請至少指定一家公司或一位會員，或啟用廣播模式");

        var candidates = await ResolveRecipientsAsync(
            request.CompanyIds ?? new List<Guid>(),
            request.MemberIds ?? new List<Guid>(),
            request.Filter,
            request.Broadcast,
            cancellationToken);

        if (candidates.Count == 0)
            return Result<EnqueueCampaignResponse>.Failure("篩選後沒有任何收件人");

        if (request.SendMode == EmailSendMode.PerRecipient && candidates.Count > PerRecipientHardCap)
            return Result<EnqueueCampaignResponse>.Failure(
                $"PerRecipient 上限 {PerRecipientHardCap} 人，目前 {candidates.Count} 人");

        var scheduleAt = request.ScheduleAt;
        if (scheduleAt.HasValue)
            scheduleAt = DateTime.SpecifyKind(scheduleAt.Value, DateTimeKind.Utc);
        var effectiveSchedule = scheduleAt ?? DateTime.UtcNow;

        var snapshot = new
        {
            companyIds = request.CompanyIds,
            memberIds = request.MemberIds,
            filter = request.Filter,
            broadcast = request.Broadcast,
            sendMode = request.SendMode.ToString(),
            resolvedCount = candidates.Count,
            // BCC 模式才在快照存 emails 清單；PerRecipient 用 Recipient rows
            emails = request.SendMode == EmailSendMode.Bcc
                ? candidates.Select(c => c.Email).Distinct().ToList()
                : null
        };

        var campaign = new EmailCampaign
        {
            Id = Guid.NewGuid(),
            Subject = request.Subject,
            Body = request.Body,
            RecipientSnapshot = JsonSerializer.Serialize(snapshot),
            Status = EmailCampaignStatus.Queued,
            SendMode = (int)request.SendMode,
            ScheduleAt = effectiveSchedule,
            TotalCount = candidates.Count,
            ApplyLayout = request.ApplyLayout,
            CreatedBy = operatorId,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow
        };
        _db.EmailCampaigns.Add(campaign);

        if (request.AttachmentFileIds.Count > 0)
        {
            var distinctFileIds = request.AttachmentFileIds.Distinct().ToList();
            foreach (var fileId in distinctFileIds)
            {
                var info = await _fileManagementService.GetFileByIdAsync(fileId, cancellationToken);
                if (!info.IsSuccess || info.Data == null)
                {
                    _logger.LogWarning("Attachment file {FileId} not found, skip", fileId);
                    continue;
                }
                _db.EmailCampaignAttachments.Add(new EmailCampaignAttachment
                {
                    Id = Guid.NewGuid(),
                    CampaignId = campaign.Id,
                    FileId = fileId,
                    FileName = info.Data.OriginalFileName,
                    ContentType = info.Data.ContentType,
                    FileSize = info.Data.FileSize,
                    CreatedTime = DateTime.UtcNow,
                    UpdatedTime = DateTime.UtcNow
                });
            }
        }

        if (request.SendMode == EmailSendMode.PerRecipient)
        {
            var rows = candidates.Select(c => new EmailCampaignRecipient
            {
                Id = Guid.NewGuid(),
                CampaignId = campaign.Id,
                MemberId = c.MemberId,
                Email = c.Email,
                Variables = JsonSerializer.Serialize(c.Variables),
                Status = EmailCampaignRecipientStatus.Pending,
                CreatedTime = DateTime.UtcNow,
                UpdatedTime = DateTime.UtcNow
            });
            _db.EmailCampaignRecipients.AddRange(rows);
        }

        await _db.SaveChangesAsync(cancellationToken);

        return Result<EnqueueCampaignResponse>.Success(new EnqueueCampaignResponse
        {
            CampaignId = campaign.Id,
            TotalRecipients = candidates.Count,
            ScheduledFor = effectiveSchedule,
            Status = (int)campaign.Status
        });
    }

    public async Task<bool> ProcessNextDueAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var campaign = await _db.EmailCampaigns
            .Where(c => c.Status == EmailCampaignStatus.Queued
                        && c.ScheduleAt != null
                        && c.ScheduleAt <= now)
            .OrderBy(c => c.ScheduleAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (campaign == null) return false;

        campaign.Status = EmailCampaignStatus.Sending;
        campaign.StartedTime = DateTime.UtcNow;
        campaign.UpdatedTime = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        try
        {
            if (campaign.SendMode == (int)EmailSendMode.PerRecipient)
                await ProcessPerRecipientAsync(campaign, cancellationToken);
            else
                await ProcessBccAsync(campaign, cancellationToken);

            campaign.Status = campaign.FailedCount > 0 && campaign.SuccessCount == 0
                ? EmailCampaignStatus.Failed
                : EmailCampaignStatus.Completed;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Campaign {CampaignId} processing crashed", campaign.Id);
            campaign.Status = EmailCampaignStatus.Failed;
            campaign.ErrorMessage = ex.Message;
        }

        campaign.CompletedTime = DateTime.UtcNow;
        campaign.UpdatedTime = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<Result> CancelAsync(Guid campaignId, CancellationToken cancellationToken = default)
    {
        var campaign = await _db.EmailCampaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);
        if (campaign == null) return Result.Failure("活動不存在");
        if (campaign.Status != EmailCampaignStatus.Queued)
            return Result.Failure($"只有 Queued 狀態可以取消，目前狀態：{campaign.Status}");

        campaign.Status = EmailCampaignStatus.Cancelled;
        campaign.UpdatedTime = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result<EnqueueCampaignResponse>> RetryFailedAsync(
        Guid sourceCampaignId,
        string? operatorId,
        CancellationToken cancellationToken = default)
    {
        var source = await _db.EmailCampaigns.FirstOrDefaultAsync(c => c.Id == sourceCampaignId, cancellationToken);
        if (source == null)
            return Result<EnqueueCampaignResponse>.Failure("來源活動不存在");
        if (source.SendMode != (int)EmailSendMode.PerRecipient)
            return Result<EnqueueCampaignResponse>.Failure("僅 PerRecipient 模式支援重試失敗收件人");

        var failedRows = await _db.EmailCampaignRecipients
            .Where(r => r.CampaignId == sourceCampaignId && r.Status == EmailCampaignRecipientStatus.Failed)
            .ToListAsync(cancellationToken);

        if (failedRows.Count == 0)
            return Result<EnqueueCampaignResponse>.Failure("沒有可重試的失敗收件人");

        var now = DateTime.UtcNow;
        var newCampaign = new EmailCampaign
        {
            Id = Guid.NewGuid(),
            Subject = source.Subject,
            Body = source.Body,
            RecipientSnapshot = JsonSerializer.Serialize(new
            {
                retryOf = sourceCampaignId,
                retryCount = failedRows.Count,
                sendMode = EmailSendMode.PerRecipient.ToString()
            }),
            Status = EmailCampaignStatus.Queued,
            SendMode = (int)EmailSendMode.PerRecipient,
            ScheduleAt = now,
            TotalCount = failedRows.Count,
            ApplyLayout = source.ApplyLayout,
            CreatedBy = operatorId,
            CreatedTime = now,
            UpdatedTime = now
        };
        _db.EmailCampaigns.Add(newCampaign);

        var sourceAttachments = await _db.EmailCampaignAttachments
            .Where(a => a.CampaignId == sourceCampaignId)
            .ToListAsync(cancellationToken);
        foreach (var sa in sourceAttachments)
        {
            _db.EmailCampaignAttachments.Add(new EmailCampaignAttachment
            {
                Id = Guid.NewGuid(),
                CampaignId = newCampaign.Id,
                FileId = sa.FileId,
                FileName = sa.FileName,
                ContentType = sa.ContentType,
                FileSize = sa.FileSize,
                CreatedTime = now,
                UpdatedTime = now
            });
        }

        var newRows = failedRows.Select(r => new EmailCampaignRecipient
        {
            Id = Guid.NewGuid(),
            CampaignId = newCampaign.Id,
            MemberId = r.MemberId,
            Email = r.Email,
            Variables = r.Variables,
            Status = EmailCampaignRecipientStatus.Pending,
            CreatedTime = now,
            UpdatedTime = now
        });
        _db.EmailCampaignRecipients.AddRange(newRows);

        await _db.SaveChangesAsync(cancellationToken);

        return Result<EnqueueCampaignResponse>.Success(new EnqueueCampaignResponse
        {
            CampaignId = newCampaign.Id,
            TotalRecipients = failedRows.Count,
            ScheduledFor = now,
            Status = (int)newCampaign.Status
        });
    }

    public async Task<Result<PagedResult<CampaignListItemResponse>>> ListAsync(
        CampaignListQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _db.EmailCampaigns.AsQueryable();

        if (parameters.Status.HasValue)
            query = query.Where(c => (int)c.Status == parameters.Status.Value);

        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var s = parameters.Search;
            query = query.Where(c => c.Subject.Contains(s));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(c => c.CreatedTime)
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .Select(c => MapListItem(c))
            .ToListAsync(cancellationToken);

        return Result<PagedResult<CampaignListItemResponse>>.Success(new PagedResult<CampaignListItemResponse>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        });
    }

    public async Task<Result<CampaignDetailResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var c = await _db.EmailCampaigns.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (c == null) return Result<CampaignDetailResponse>.Failure("活動不存在");

        var attachments = await _db.EmailCampaignAttachments
            .Where(a => a.CampaignId == id)
            .OrderBy(a => a.CreatedTime)
            .Select(a => new CampaignAttachmentItem
            {
                Id = a.Id,
                FileId = a.FileId,
                FileName = a.FileName,
                ContentType = a.ContentType,
                FileSize = a.FileSize
            })
            .ToListAsync(cancellationToken);

        var dto = new CampaignDetailResponse
        {
            Id = c.Id,
            Subject = c.Subject,
            Body = c.Body,
            RecipientSnapshot = c.RecipientSnapshot,
            Status = (int)c.Status,
            StatusText = c.Status.ToString(),
            SendMode = c.SendMode,
            ScheduleAt = c.ScheduleAt,
            TotalCount = c.TotalCount,
            SuccessCount = c.SuccessCount,
            FailedCount = c.FailedCount,
            CreatedBy = c.CreatedBy,
            CreatedTime = c.CreatedTime,
            StartedTime = c.StartedTime,
            CompletedTime = c.CompletedTime,
            ErrorMessage = c.ErrorMessage,
            ApplyLayout = c.ApplyLayout,
            Attachments = attachments
        };
        return Result<CampaignDetailResponse>.Success(dto);
    }

    // ==================== 預覽（仍同步） ====================

    public async Task<Result<int>> PreviewRecipientCountAsync(
        List<Guid> companyIds,
        List<Guid> memberIds,
        CampaignRecipientFilter? filter,
        bool broadcast,
        CancellationToken cancellationToken = default)
    {
        var candidates = await ResolveRecipientsAsync(companyIds, memberIds, filter, broadcast, cancellationToken);
        return Result<int>.Success(candidates.Count);
    }

    public async Task<Result<PreviewRecipientListResponse>> PreviewRecipientListAsync(
        PreviewRecipientListRequest request,
        CancellationToken cancellationToken = default)
    {
        var candidates = await ResolveRecipientsAsync(
            request.CompanyIds ?? new List<Guid>(),
            request.MemberIds ?? new List<Guid>(),
            request.Filter,
            request.Broadcast,
            cancellationToken);

        var limit = Math.Clamp(request.Limit, 1, 200);

        return Result<PreviewRecipientListResponse>.Success(new PreviewRecipientListResponse
        {
            TotalCount = candidates.Count,
            Items = candidates.Take(limit).Select(c => new RecipientPreviewItem
            {
                MemberId = c.MemberId,
                Email = c.Email,
                Name = c.Name,
                CompanyName = c.CompanyName,
                Position = c.Position
            }).ToList()
        });
    }

    public async Task<Result> TestSendAsync(TestSendCampaignRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Subject))
            return Result.Failure("主旨不可為空");
        if (string.IsNullOrWhiteSpace(request.Body))
            return Result.Failure("內容不可為空");
        if (string.IsNullOrWhiteSpace(request.TestEmail))
            return Result.Failure("請輸入測試收件 Email");

        var subject = SubstituteVariables(request.Subject, request.Variables ?? new());
        var rawBody = SubstituteVariables(request.Body, request.Variables ?? new());

        string body = rawBody;
        Dictionary<string, (Stream Stream, string ContentType)>? linkedResources = null;
        if (request.ApplyLayout)
        {
            (body, linkedResources) = await _emailService.WrapWithLayoutAsync(subject, rawBody);
        }

        List<EmailAttachment>? attachments = null;
        if (request.AttachmentFileIds is { Count: > 0 })
        {
            attachments = new List<EmailAttachment>();
            foreach (var fileId in request.AttachmentFileIds.Distinct())
            {
                try
                {
                    var dl = await _fileManagementService.DownloadFileAsync(fileId, cancellationToken);
                    if (!dl.IsSuccess || dl.Data.FileStream == null)
                    {
                        _logger.LogWarning("Test-send: attachment {FileId} download failed, skip", fileId);
                        continue;
                    }
                    using var ms = new MemoryStream();
                    await dl.Data.FileStream.CopyToAsync(ms, cancellationToken);
                    await dl.Data.FileStream.DisposeAsync();
                    attachments.Add(new EmailAttachment
                    {
                        FileName = dl.Data.FileName,
                        Content = ms.ToArray(),
                        ContentType = dl.Data.ContentType ?? "application/octet-stream"
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Test-send: failed to load attachment {FileId}", fileId);
                }
            }
        }

        try
        {
            await _emailService.SendEmailAsync(new EmailOption
            {
                To = request.TestEmail,
                Subject = "[測試] " + subject,
                Body = body,
                LinkedResources = linkedResources,
                Attachments = attachments,
                MailType = "TestSend"
            });
            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Test-send failed for {Email}", request.TestEmail);
            return Result.Failure($"寄送失敗：{ex.Message}");
        }
    }

    // ==================== 內部：worker 處理流程 ====================

    private async Task ProcessBccAsync(EmailCampaign campaign, CancellationToken cancellationToken)
    {
        var emails = ExtractBccEmailsFromSnapshot(campaign.RecipientSnapshot);
        if (emails.Count == 0)
        {
            campaign.ErrorMessage = "Snapshot 沒有收件 email 清單";
            return;
        }

        var attachments = await LoadAttachmentsAsync(campaign.Id, cancellationToken);
        var (wrappedBody, linkedResources) = await ResolveBodyAsync(campaign, campaign.Body, cancellationToken);

        foreach (var batch in emails.Chunk(BatchSize))
        {
            cancellationToken.ThrowIfCancellationRequested();
            try
            {
                await _emailService.SendEmailAsync(new EmailOption
                {
                    To = batch[0],
                    Bcc = batch.Skip(1).ToList(),
                    Subject = campaign.Subject,
                    Body = wrappedBody,
                    LinkedResources = CloneLinkedResources(linkedResources),
                    Attachments = attachments,
                    MailType = MailTypeBulk,
                    CampaignId = campaign.Id
                });
                campaign.SuccessCount += batch.Length;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "BCC batch failed for campaign {CampaignId}", campaign.Id);
                campaign.FailedCount += batch.Length;
            }

            campaign.UpdatedTime = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task ProcessPerRecipientAsync(EmailCampaign campaign, CancellationToken cancellationToken)
    {
        var rows = await _db.EmailCampaignRecipients
            .Where(r => r.CampaignId == campaign.Id && r.Status == EmailCampaignRecipientStatus.Pending)
            .ToListAsync(cancellationToken);

        var attachments = await LoadAttachmentsAsync(campaign.Id, cancellationToken);

        foreach (var row in rows)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var variables = ParseVariables(row.Variables);
            var subject = SubstituteVariables(campaign.Subject, variables);
            var rawBody = SubstituteVariables(campaign.Body, variables);
            var (body, linkedResources) = await ResolveBodyAsync(campaign, rawBody, cancellationToken);

            try
            {
                await _emailService.SendEmailAsync(new EmailOption
                {
                    To = row.Email,
                    Subject = subject,
                    Body = body,
                    LinkedResources = CloneLinkedResources(linkedResources),
                    Attachments = attachments,
                    MailType = MailTypePersonalized,
                    CampaignId = campaign.Id
                });
                row.Status = EmailCampaignRecipientStatus.Sent;
                campaign.SuccessCount++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Per-recipient send failed: campaign={CampaignId} email={Email}",
                    campaign.Id, row.Email);
                row.Status = EmailCampaignRecipientStatus.Failed;
                row.ErrorMessage = ex.Message;
                campaign.FailedCount++;
            }

            row.UpdatedTime = DateTime.UtcNow;
            campaign.UpdatedTime = DateTime.UtcNow;

            // 每 10 筆 flush 一次，降低長時間 worker 過程中當機的損失
            if ((campaign.SuccessCount + campaign.FailedCount) % 10 == 0)
                await _db.SaveChangesAsync(cancellationToken);
        }

        // 配對 MailLogId
        var mailLogs = await _db.MailLogs
            .Where(l => l.CampaignId == campaign.Id)
            .Select(l => new { l.Id, l.Receivers })
            .ToListAsync(cancellationToken);
        foreach (var r in rows)
        {
            var match = mailLogs.LastOrDefault(l => l.Receivers == r.Email);
            if (match != null) r.MailLogId = match.Id;
        }

        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task<List<EmailAttachment>?> LoadAttachmentsAsync(Guid campaignId, CancellationToken cancellationToken)
    {
        var records = await _db.EmailCampaignAttachments
            .Where(a => a.CampaignId == campaignId)
            .ToListAsync(cancellationToken);

        if (records.Count == 0) return null;

        var result = new List<EmailAttachment>(records.Count);
        foreach (var r in records)
        {
            try
            {
                var dl = await _fileManagementService.DownloadFileAsync(r.FileId, cancellationToken);
                if (!dl.IsSuccess || dl.Data.FileStream == null)
                {
                    _logger.LogWarning("Attachment file {FileId} download failed for campaign {CampaignId}, skip",
                        r.FileId, campaignId);
                    continue;
                }
                using var ms = new MemoryStream();
                await dl.Data.FileStream.CopyToAsync(ms, cancellationToken);
                await dl.Data.FileStream.DisposeAsync();
                result.Add(new EmailAttachment
                {
                    FileName = r.FileName,
                    Content = ms.ToArray(),
                    ContentType = !string.IsNullOrWhiteSpace(r.ContentType)
                        ? r.ContentType!
                        : (dl.Data.ContentType ?? "application/octet-stream")
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load attachment {FileId} for campaign {CampaignId}",
                    r.FileId, campaignId);
            }
        }
        return result.Count > 0 ? result : null;
    }

    private async Task<(string Body, Dictionary<string, (Stream Stream, string ContentType)>? LinkedResources)>
        ResolveBodyAsync(EmailCampaign campaign, string body, CancellationToken cancellationToken)
    {
        if (!campaign.ApplyLayout) return (body, null);
        var (wrapped, resources) = await _emailService.WrapWithLayoutAsync(campaign.Subject, body);
        return (wrapped, resources);
    }

    /// <summary>
    /// 將 LinkedResources 內的 Stream 複製成獨立 MemoryStream，避免在多次 SendEmailAsync 重用同一個 stream。
    /// 注意：原始 stream 必須是可重複 Seek 的 MemoryStream（WrapWithLayoutAsync 內部已使用 MemoryStream）。
    /// </summary>
    private static Dictionary<string, (Stream Stream, string ContentType)>? CloneLinkedResources(
        Dictionary<string, (Stream Stream, string ContentType)>? source)
    {
        if (source == null || source.Count == 0) return null;
        var clone = new Dictionary<string, (Stream Stream, string ContentType)>(source.Count);
        foreach (var (key, (stream, ct)) in source)
        {
            byte[] bytes;
            if (stream is MemoryStream ms)
            {
                bytes = ms.ToArray();
            }
            else
            {
                using var copy = new MemoryStream();
                stream.Position = 0;
                stream.CopyTo(copy);
                bytes = copy.ToArray();
            }
            clone[key] = (new MemoryStream(bytes, writable: false), ct);
        }
        return clone;
    }

    private static List<string> ExtractBccEmailsFromSnapshot(string? snapshot)
    {
        if (string.IsNullOrWhiteSpace(snapshot)) return new();
        try
        {
            using var doc = JsonDocument.Parse(snapshot);
            if (doc.RootElement.TryGetProperty("emails", out var arr) && arr.ValueKind == JsonValueKind.Array)
                return arr.EnumerateArray().Select(e => e.GetString() ?? "").Where(s => !string.IsNullOrEmpty(s)).ToList();
        }
        catch { /* fallthrough */ }
        return new();
    }

    private static Dictionary<string, string> ParseVariables(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? new();
        }
        catch
        {
            return new();
        }
    }

    private static string SubstituteVariables(string template, Dictionary<string, string> variables)
    {
        if (string.IsNullOrEmpty(template) || variables.Count == 0) return template;
        return VariablePattern.Replace(template, m =>
        {
            var key = m.Groups["key"].Value;
            return variables.TryGetValue(key, out var v) ? v : m.Value;
        });
    }

    private static CampaignListItemResponse MapListItem(EmailCampaign c) => new()
    {
        Id = c.Id,
        Subject = c.Subject,
        Status = (int)c.Status,
        StatusText = c.Status.ToString(),
        SendMode = c.SendMode,
        ScheduleAt = c.ScheduleAt,
        TotalCount = c.TotalCount,
        SuccessCount = c.SuccessCount,
        FailedCount = c.FailedCount,
        CreatedBy = c.CreatedBy,
        CreatedTime = c.CreatedTime,
        StartedTime = c.StartedTime,
        CompletedTime = c.CompletedTime,
        ErrorMessage = c.ErrorMessage
    };

    // ==================== 收件人解析（同 Slice 4） ====================

    private async Task<List<RecipientCandidate>> ResolveRecipientsAsync(
        List<Guid> companyIds,
        List<Guid> memberIds,
        CampaignRecipientFilter? filter,
        bool broadcast,
        CancellationToken cancellationToken)
    {
        var memberStatus = filter?.MemberStatus ?? (short)Status.Active;
        var query = _db.Members.Where(m => (short)m.Status == memberStatus);

        if (filter?.MemberDataMode.HasValue == true)
            query = query.Where(m => (short)m.DataMode == filter.MemberDataMode.Value);

        if (companyIds.Count > 0 && memberIds.Count > 0)
            query = query.Where(m =>
                (m.CompanyId != null && companyIds.Contains(m.CompanyId.Value)) ||
                memberIds.Contains(m.Id));
        else if (companyIds.Count > 0)
            query = query.Where(m => m.CompanyId != null && companyIds.Contains(m.CompanyId.Value));
        else if (memberIds.Count > 0)
            query = query.Where(m => memberIds.Contains(m.Id));
        else if (broadcast)
        {
            // 廣播：不限公司／會員，依 filter 縮窄。要求至少一個有意義條件，避免不慎全發
            var hasNarrowingFilter =
                filter?.CompanyTypes is { Count: > 0 }
                || filter?.CompanyLevels is { Count: > 0 }
                || filter?.CompanyTagIds is { Count: > 0 }
                || filter?.MemberDataMode.HasValue == true;
            if (!hasNarrowingFilter && memberStatus == (short)Status.Active)
            {
                // 真的就是「全部 Active 會員」，繼續往下走
            }
        }
        else
        {
            return new List<RecipientCandidate>();
        }

        var members = await query
            .Where(m => m.Email != null && m.Email != "")
            .Select(m => new
            {
                m.Id,
                m.Email,
                m.Nickname,
                m.Number,
                m.Position,
                m.MemberJobTitle,
                m.CompanyId
            })
            .ToListAsync(cancellationToken);

        var allCompanyIds = members.Where(m => m.CompanyId.HasValue)
            .Select(m => m.CompanyId!.Value).Distinct().ToList();

        var companyMap = new Dictionary<Guid, (string Name, string Number, short Type, short Level)>();
        if (allCompanyIds.Count > 0)
        {
            var companyQuery = _db.Companies.Where(c => allCompanyIds.Contains(c.Id));
            if (filter?.CompanyTypes is { Count: > 0 } types)
                companyQuery = companyQuery.Where(c => types.Contains((short)c.Type));
            if (filter?.CompanyLevels is { Count: > 0 } levels)
                companyQuery = companyQuery.Where(c => levels.Contains((short)c.Level));

            var companies = await companyQuery
                .Select(c => new { c.Id, c.Name, c.Number, c.Type, c.Level })
                .ToListAsync(cancellationToken);

            companyMap = companies.ToDictionary(c => c.Id, c => (c.Name, c.Number, (short)c.Type, (short)c.Level));
        }

        HashSet<Guid>? companiesPassingTagFilter = null;
        if (filter?.CompanyTagIds is { Count: > 0 } tagIds && allCompanyIds.Count > 0)
        {
            var taggedCompanyIds = await _db.EntityTags
                .Where(t => t.EntityType == EntityType.Company
                            && tagIds.Contains(t.TagId)
                            && allCompanyIds.Contains(Guid.Parse(t.EntityId)))
                .Select(t => Guid.Parse(t.EntityId))
                .Distinct()
                .ToListAsync(cancellationToken);
            companiesPassingTagFilter = taggedCompanyIds.ToHashSet();
        }

        var result = new List<RecipientCandidate>();
        var seenEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var m in members)
        {
            string? companyName = null;
            string? companyNumber = null;
            if (m.CompanyId.HasValue)
            {
                if (!companyMap.TryGetValue(m.CompanyId.Value, out var co)) continue;
                if (companiesPassingTagFilter != null && !companiesPassingTagFilter.Contains(m.CompanyId.Value)) continue;
                companyName = co.Name;
                companyNumber = co.Number;
            }
            else
            {
                if (filter?.CompanyTypes is { Count: > 0 }
                    || filter?.CompanyLevels is { Count: > 0 }
                    || filter?.CompanyTagIds is { Count: > 0 })
                    continue;
            }

            if (!seenEmails.Add(m.Email)) continue;

            var variables = new Dictionary<string, string>
            {
                ["Name"] = m.Nickname ?? "會員",
                ["Email"] = m.Email,
                ["MemberNumber"] = m.Number,
                ["Position"] = m.Position ?? m.MemberJobTitle ?? "",
                ["CompanyName"] = companyName ?? "貴公司",
                ["CompanyNumber"] = companyNumber ?? ""
            };

            result.Add(new RecipientCandidate
            {
                MemberId = m.Id,
                Email = m.Email,
                Name = m.Nickname,
                CompanyName = companyName,
                Position = m.Position ?? m.MemberJobTitle,
                Variables = variables
            });
        }

        return result;
    }

    private sealed class RecipientCandidate
    {
        public Guid MemberId { get; init; }
        public string Email { get; init; } = string.Empty;
        public string? Name { get; init; }
        public string? CompanyName { get; init; }
        public string? Position { get; init; }
        public Dictionary<string, string> Variables { get; init; } = new();
    }
}
