using System.Threading.Channels;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SPS.Application.DTOs.Notification;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;

namespace SPS.Infrastructure.Services;

/// <summary>什麼都不做的即時通知（沒有 API 專案的 SignalR hub 時用，例如測試或背景工具）。API 專案會註冊真的實作蓋掉它。</summary>
public sealed class NullAdminRealtimeNotifier : IAdminRealtimeNotifier
{
    public Task PublishAsync(UserPermission requiredPermission, string eventName, object payload, CancellationToken ct = default) => Task.CompletedTask;
}

/// <summary>
/// 後台「內容檢查」任務的佇列與執行者（見 <see cref="IArticleCheckJobService"/>）。同一時間只會有一個任務。
/// 進度（已檢查篇數、百分比）每 0.5 秒最多推一次給後台；每批之間短暫停頓，避免吃光網站的資料庫連線。
/// </summary>
public sealed class ArticleCheckJobService : BackgroundService, IArticleCheckJobService
{
    /// <summary>事件名稱：進度與結束狀態都用這個，payload 是 <see cref="ArticleCheckJobDto"/></summary>
    public const string ProgressEvent = "ArticleCheckProgress";

    private const int BatchSize = 20;
    private const int MaxFindings = 300;
    private static readonly TimeSpan PauseBetweenBatches = TimeSpan.FromMilliseconds(200);
    private static readonly TimeSpan MinProgressInterval = TimeSpan.FromMilliseconds(500);

    private sealed class Job
    {
        public Guid Id = Guid.NewGuid();
        public string Status = "Queued";
        public bool ApplyDraft;
        public int Total;
        public int Checked;
        public int Flagged;
        public int Drafted;
        public readonly List<ArticleCheckFindingDto> Findings = new();
        public string? RequestedBy;
        public string? Recipient;
        public DateTime CreatedAt = DateTime.UtcNow;
        public DateTime? StartedAt;
        public DateTime? FinishedAt;
        public string? Error;
        public readonly CancellationTokenSource Cancel = new();
    }

    private readonly Channel<Job> _queue = Channel.CreateUnbounded<Job>();
    private readonly object _lock = new();
    private Job? _latest;

    private readonly IServiceScopeFactory _scopes;
    private readonly IAdminRealtimeNotifier _notifier;
    private readonly ILogger<ArticleCheckJobService> _logger;

    public ArticleCheckJobService(IServiceScopeFactory scopes, IAdminRealtimeNotifier notifier, ILogger<ArticleCheckJobService> logger)
    {
        _scopes = scopes;
        _notifier = notifier;
        _logger = logger;
    }

    public async Task<ArticleCheckEnqueueResult> EnqueueAsync(bool applyDraft, string? requestedBy, string? recipient, CancellationToken ct)
    {
        ArticleCheckEnqueueResult result;
        lock (_lock)
        {
            if (_latest is { Status: "Queued" or "Running" })
                return new ArticleCheckEnqueueResult { Job = ToDto(_latest), AlreadyActive = true };

            var job = new Job { ApplyDraft = applyDraft, RequestedBy = requestedBy, Recipient = recipient };
            _latest = job;
            _queue.Writer.TryWrite(job);
            _logger.LogInformation("內容檢查任務已排入佇列：{Id}（{Mode}，{User}）", job.Id, applyDraft ? "轉草稿" : "預覽", requestedBy);
            result = new ArticleCheckEnqueueResult { Job = ToDto(job), AlreadyActive = false };
        }

        await PublishAsync(result.Job, CancellationToken.None);
        return result;
    }

    public ArticleCheckJobDto? GetLatest()
    {
        lock (_lock) return _latest == null ? null : ToDto(_latest);
    }

    public bool Cancel(Guid jobId)
    {
        lock (_lock)
        {
            if (_latest == null || _latest.Id != jobId || _latest.Status is not ("Queued" or "Running")) return false;
            _latest.Cancel.Cancel();
            return true;
        }
    }

    private ArticleCheckJobDto ToDto(Job j) => new()
    {
        Id = j.Id,
        Status = j.Status,
        ApplyDraft = j.ApplyDraft,
        Total = j.Total,
        Checked = j.Checked,
        Flagged = j.Flagged,
        Drafted = j.Drafted,
        Percent = j.Total <= 0 ? (j.Status == "Completed" ? 100 : 0) : Math.Min(100, (int)Math.Round(j.Checked * 100.0 / j.Total)),
        Findings = j.Findings.ToList(),
        RequestedBy = j.RequestedBy,
        CreatedAt = j.CreatedAt,
        StartedAt = j.StartedAt,
        FinishedAt = j.FinishedAt,
        Error = j.Error,
    };

    private async Task PublishAsync(ArticleCheckJobDto dto, CancellationToken ct)
    {
        try
        {
            await _notifier.PublishAsync(UserPermission.ManageSettings, ProgressEvent, dto, ct);
        }
        catch (Exception ex)
        {
            // 即時推送失敗不影響檢查本身（後台重新整理後還是查得到狀態）
            _logger.LogDebug(ex, "內容檢查進度推送失敗");
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await foreach (var job in _queue.Reader.ReadAllAsync(stoppingToken))
                await RunJobAsync(job, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            // 網站關閉
        }
    }

    private async Task RunJobAsync(Job job, CancellationToken stoppingToken)
    {
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken, job.Cancel.Token);
        var ct = linked.Token;

        try
        {
            if (job.Cancel.IsCancellationRequested) throw new OperationCanceledException(ct);

            List<ArticleRef> articles;
            using (var scope = _scopes.CreateScope())
                articles = await scope.ServiceProvider.GetRequiredService<IArticleValidationService>().ListPublishedAsync(ct);

            lock (_lock)
            {
                job.Total = articles.Count;
                job.Status = "Running";
                job.StartedAt = DateTime.UtcNow;
            }
            _logger.LogInformation("內容檢查任務開始：{Id}，共 {Total} 篇已發布文章（{Mode}）", job.Id, articles.Count, job.ApplyDraft ? "轉草稿" : "預覽");
            await PublishAsync(Snapshot(job), CancellationToken.None);

            var lastPush = DateTime.UtcNow;
            foreach (var chunk in articles.Chunk(BatchSize))
            {
                ct.ThrowIfCancellationRequested();
                using var scope = _scopes.CreateScope();
                var validation = scope.ServiceProvider.GetRequiredService<IArticleValidationService>();

                foreach (var article in chunk)
                {
                    ct.ThrowIfCancellationRequested();
                    ArticleCheckResult? result = null;
                    try
                    {
                        result = await validation.CheckAsync(article.Kind, article.Id, job.ApplyDraft, ct);
                    }
                    catch (OperationCanceledException)
                    {
                        throw;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "內容檢查 {Kind} #{Id} 發生例外，略過", article.Kind, article.Id);
                    }

                    lock (_lock)
                    {
                        job.Checked++;
                        if (result is { Outcome: ArticleCheckOutcome.Drafted or ArticleCheckOutcome.WouldDraft })
                        {
                            job.Flagged++;
                            var drafted = result.Outcome == ArticleCheckOutcome.Drafted;
                            if (drafted) job.Drafted++;
                            if (job.Findings.Count < MaxFindings)
                                job.Findings.Add(new ArticleCheckFindingDto { Kind = article.Kind.ToString(), Id = article.Id, Title = result.Title, Reason = result.Reason ?? string.Empty, Drafted = drafted });
                        }
                    }
                }

                if (DateTime.UtcNow - lastPush >= MinProgressInterval)
                {
                    lastPush = DateTime.UtcNow;
                    await PublishAsync(Snapshot(job), CancellationToken.None);
                }

                await Task.Delay(PauseBetweenBatches, ct);
            }

            Finish(job, "Completed", null);
            _logger.LogInformation("內容檢查任務完成：{Id}，檢查 {Checked} 篇，有問題 {Flagged} 篇，轉草稿 {Drafted} 篇", job.Id, job.Checked, job.Flagged, job.Drafted);
        }
        catch (OperationCanceledException)
        {
            Finish(job, "Cancelled", null);
            _logger.LogInformation("內容檢查任務已取消：{Id}（已檢查 {Checked} 篇）", job.Id, job.Checked);
        }
        catch (Exception ex)
        {
            Finish(job, "Failed", ex.Message);
            _logger.LogError(ex, "內容檢查任務失敗：{Id}", job.Id);
        }

        var final = Snapshot(job);
        await PublishAsync(final, CancellationToken.None);
        await WriteSystemNotificationAsync(job, final);
    }

    private ArticleCheckJobDto Snapshot(Job job)
    {
        lock (_lock) return ToDto(job);
    }

    private void Finish(Job job, string status, string? error)
    {
        lock (_lock)
        {
            job.Status = status;
            job.Error = error;
            job.FinishedAt = DateTime.UtcNow;
        }
    }

    /// <summary>結束時寫一則「系統」通知給啟動的人（鈴鐺的「系統」分頁），重新整理後還看得到</summary>
    private async Task WriteSystemNotificationAsync(Job job, ArticleCheckJobDto dto)
    {
        if (string.IsNullOrWhiteSpace(job.Recipient)) return;

        try
        {
            var mode = dto.ApplyDraft ? "轉草稿" : "預覽";
            var title = dto.Status switch
            {
                "Completed" => dto.Flagged == 0 ? "內容檢查完成：沒有發現問題" : $"內容檢查完成：{dto.Flagged} 篇有問題",
                "Cancelled" => "內容檢查已取消",
                _ => "內容檢查中斷",
            };
            var lines = new List<string> { $"模式：{mode}。已檢查 {dto.Checked} / {dto.Total} 篇，有問題 {dto.Flagged} 篇" + (dto.ApplyDraft ? $"，已轉草稿 {dto.Drafted} 篇。" : "（預覽，沒有動文章）。") };
            if (!string.IsNullOrEmpty(dto.Error)) lines.Add($"錯誤：{dto.Error}");
            foreach (var f in dto.Findings.Take(5)) lines.Add($"・{KindLabel(f.Kind)} #{f.Id}「{Trim(f.Title, 24)}」");
            if (dto.Findings.Count > 5) lines.Add($"…還有 {dto.Findings.Count - 5} 篇，請到「系統設定 → 內容檢查」查看。");

            using var scope = _scopes.CreateScope();
            var notifications = scope.ServiceProvider.GetRequiredService<INotificationService>();
            await notifications.CreateAsync(new CreateNotificationRequest
            {
                Type = NotificationType.InApp,
                Category = "system",
                Title = title,
                Content = Trim(string.Join("\n", lines), 1900),
                SendId = "content-check",
                Recipient = job.Recipient!,
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "寫入內容檢查結果通知失敗");
        }
    }

    private static string KindLabel(string kind) => kind switch
    {
        nameof(ArticleKind.News) => "公告",
        nameof(ArticleKind.Faq) => "常見問題",
        nameof(ArticleKind.Case) => "產業案例",
        nameof(ArticleKind.Regulation) => "法規",
        _ => kind,
    };

    private static string Trim(string? value, int max) =>
        string.IsNullOrEmpty(value) ? string.Empty : value.Length <= max ? value : value[..(max - 1)] + "…";
}
