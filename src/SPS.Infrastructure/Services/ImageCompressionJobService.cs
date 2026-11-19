using System.Threading.Channels;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SPS.Application.DTOs.Notification;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 後台「壓縮所有圖片」任務佇列與執行者。同一時間只會有一個任務（排隊中或執行中時重複按會回傳同一個）。
/// 手動任務不受離峰時段限制，但每批之間會短暫停頓，避免吃光網站的 CPU 與磁碟。
/// </summary>
public sealed class ImageCompressionJobService : BackgroundService, IImageCompressionJobService
{
    /// <summary>即時推給後台鈴鐺的事件名稱，payload 是 <see cref="ImageCompressionJobDto"/>（後台 useAdminRealtime 訂閱）</summary>
    public const string ProgressEvent = "ImageCompressionProgress";

    private static readonly TimeSpan PauseBetweenBatches = TimeSpan.FromMilliseconds(500);
    private static readonly TimeSpan MinProgressInterval = TimeSpan.FromMilliseconds(500);

    private sealed class Job
    {
        public Guid Id = Guid.NewGuid();
        public string Status = "Queued";
        public int Total;
        public readonly ImageOptimizationTotals Totals = new();
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

    private readonly ImageOptimizationProcessor _processor;
    private readonly IOptionsMonitor<ImageOptimizationOptions> _options;
    private readonly IAdminRealtimeNotifier _notifier;
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<ImageCompressionJobService> _logger;

    public ImageCompressionJobService(
        ImageOptimizationProcessor processor,
        IOptionsMonitor<ImageOptimizationOptions> options,
        IAdminRealtimeNotifier notifier,
        IServiceScopeFactory scopes,
        ILogger<ImageCompressionJobService> logger)
    {
        _processor = processor;
        _options = options;
        _notifier = notifier;
        _scopes = scopes;
        _logger = logger;
    }

    public async Task<ImageCompressionEnqueueResult> EnqueueAsync(string? requestedBy, string? recipient, CancellationToken ct)
    {
        ImageCompressionEnqueueResult result;
        lock (_lock)
        {
            if (_latest is { Status: "Queued" or "Running" })
                return new ImageCompressionEnqueueResult { Job = ToDto(_latest), AlreadyActive = true };

            var job = new Job { RequestedBy = requestedBy, Recipient = recipient };
            _latest = job;
            _queue.Writer.TryWrite(job);
            _logger.LogInformation("圖片壓縮任務已排入佇列：{Id}（{User}）", job.Id, requestedBy);
            result = new ImageCompressionEnqueueResult { Job = ToDto(job), AlreadyActive = false };
        }

        await PublishAsync(result.Job);
        return result;
    }

    private async Task PublishAsync(ImageCompressionJobDto dto)
    {
        try
        {
            await _notifier.PublishAsync(UserPermission.ManageFiles, ProgressEvent, dto);
        }
        catch (Exception ex)
        {
            // 即時推送失敗不影響壓縮本身（後台重新整理後還是查得到狀態）
            _logger.LogDebug(ex, "圖片壓縮進度推送失敗");
        }
    }

    private ImageCompressionJobDto Snapshot(Job job)
    {
        lock (_lock) return ToDto(job);
    }

    public async Task<ImageCompressionStatusDto> GetStatusAsync(CancellationToken ct)
    {
        var pending = await _processor.CountPendingAsync(ct);
        lock (_lock)
        {
            return new ImageCompressionStatusDto { PendingCount = pending, Job = _latest == null ? null : ToDto(_latest) };
        }
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

    private ImageCompressionJobDto ToDto(Job j) => new()
    {
        Id = j.Id,
        Status = j.Status,
        Total = j.Total,
        Processed = j.Totals.Processed,
        Converted = j.Totals.Converted,
        KeptOriginal = j.Totals.KeptOriginal,
        Failed = j.Totals.Failed,
        Missing = j.Totals.Missing,
        SavedBytes = j.Totals.SavedBytes,
        RequestedBy = j.RequestedBy,
        CreatedAt = j.CreatedAt,
        StartedAt = j.StartedAt,
        FinishedAt = j.FinishedAt,
        Error = j.Error,
    };

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await foreach (var job in _queue.Reader.ReadAllAsync(stoppingToken))
            {
                await RunJobAsync(job, stoppingToken);
            }
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

            var pending = await _processor.CountPendingAsync(ct);
            lock (_lock)
            {
                job.Total = pending;
                job.Status = "Running";
                job.StartedAt = DateTime.UtcNow;
            }

            _logger.LogInformation("圖片壓縮任務開始：{Id}，待處理 {Total} 個", job.Id, pending);
            await PublishAsync(Snapshot(job));

            var seen = new HashSet<Guid>();
            var lastPush = DateTime.UtcNow;
            while (true)
            {
                var o = _options.CurrentValue;
                var handled = await _processor.RunBatchAsync(o.BatchSize, false, o.KeepOriginals, o.ArchiveFolder, seen, job.Totals, ct);
                if (handled == 0) break;

                // 進度每 0.5 秒最多推一次給後台鈴鐺
                if (DateTime.UtcNow - lastPush >= MinProgressInterval)
                {
                    lastPush = DateTime.UtcNow;
                    await PublishAsync(Snapshot(job));
                }

                await Task.Delay(PauseBetweenBatches, ct);
            }

            lock (_lock)
            {
                // 處理期間若有新增的待處理檔，讓進度條不要超過 100%
                if (job.Total < job.Totals.Processed) job.Total = job.Totals.Processed;
                job.Status = "Completed";
                job.FinishedAt = DateTime.UtcNow;
            }
            _logger.LogInformation("圖片壓縮任務完成：{Id}，轉成 WebP {C} 個、維持原檔 {K} 個、檔案遺失 {M} 個、失敗 {F} 個，省 {S:F1} MB",
                job.Id, job.Totals.Converted, job.Totals.KeptOriginal, job.Totals.Missing, job.Totals.Failed, job.Totals.SavedBytes / 1048576.0);
        }
        catch (OperationCanceledException)
        {
            lock (_lock)
            {
                job.Status = "Cancelled";
                job.FinishedAt = DateTime.UtcNow;
            }
            _logger.LogInformation("圖片壓縮任務已取消：{Id}（已處理 {P} 個）", job.Id, job.Totals.Processed);
        }
        catch (Exception ex)
        {
            lock (_lock)
            {
                job.Status = "Failed";
                job.Error = ex.Message;
                job.FinishedAt = DateTime.UtcNow;
            }
            _logger.LogError(ex, "圖片壓縮任務失敗：{Id}", job.Id);
        }

        var final = Snapshot(job);
        await PublishAsync(final);
        await WriteSystemNotificationAsync(job, final);
    }

    /// <summary>結束時寫一則「系統」通知給啟動的人（鈴鐺的「系統」分頁），重新整理後還看得到</summary>
    private async Task WriteSystemNotificationAsync(Job job, ImageCompressionJobDto dto)
    {
        if (string.IsNullOrWhiteSpace(job.Recipient)) return;

        try
        {
            var title = dto.Status switch
            {
                "Completed" => "壓縮所有圖片完成",
                "Cancelled" => "壓縮所有圖片已取消",
                _ => "壓縮所有圖片中斷",
            };
            var content = $"已處理 {dto.Processed} / {dto.Total} 個：轉成 WebP {dto.Converted} 個、維持原檔 {dto.KeptOriginal} 個、檔案遺失 {dto.Missing} 個、失敗 {dto.Failed} 個，共省下 {dto.SavedBytes / 1048576.0:F1} MB。";
            if (!string.IsNullOrEmpty(dto.Error)) content += $"\n錯誤：{dto.Error}";

            using var scope = _scopes.CreateScope();
            var notifications = scope.ServiceProvider.GetRequiredService<INotificationService>();
            await notifications.CreateAsync(new CreateNotificationRequest
            {
                Type = NotificationType.InApp,
                Category = "system",
                Title = title,
                Content = content.Length <= 1900 ? content : content[..1899] + "…",
                SendId = "image-compression",
                Recipient = job.Recipient!,
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "寫入壓縮圖片結果通知失敗");
        }
    }
}
