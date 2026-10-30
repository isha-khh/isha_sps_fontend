using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Services;

/// <summary>
/// AI 向量媒合索引排程掃描背景服務——事件觸發（§4.1）的安全網 + 重試 + 初次 backfill。
/// 找出完全沒有 ContentEmbedding 記錄、內容 hash 對不上、或失敗待重試的 Demand/Company，批次補上。
/// 同一套程式碼兼具「日常補漏」與「上線初次 backfill」兩種用途，不需要另外寫一次性工具。
/// 掃描間隔與每輪筆數取自後台「AI 語意搜尋」設定；後台也可以喚醒它立刻掃描，或要求全量重新索引。
/// 詳見 docs/設計/AI向量媒合搜尋設計.md §4.2。
/// </summary>
public class IndexReconciliationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly EmbeddingIndexJob _job;
    private readonly ILogger<IndexReconciliationBackgroundService> _logger;

    private const int DefaultBatchSize = 50;
    private const int DefaultIntervalMinutes = 5;

    public IndexReconciliationBackgroundService(
        IServiceProvider serviceProvider,
        EmbeddingIndexJob job,
        ILogger<IndexReconciliationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _job = job;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AI 向量媒合索引排程掃描服務已啟動");

        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            var intervalMinutes = DefaultIntervalMinutes;

            try
            {
                var settings = await LoadSettingsAsync(stoppingToken);
                if (settings != null)
                {
                    intervalMinutes = Math.Clamp(settings.ReconcileIntervalMinutes, 1, 1440);
                    var batchSize = Math.Clamp(settings.ReconcileBatchSize, 1, 500);

                    if (settings.IsEnabled)
                    {
                        if (_job.TakeReindexRequest())
                            await RunFullReindexAsync(batchSize, stoppingToken);
                        else
                            await RunScanAsync(batchSize, stoppingToken);
                    }
                    else
                    {
                        _logger.LogDebug("AI 語意搜尋未啟用，跳過索引掃描");
                    }
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI 向量媒合索引排程掃描發生例外");
                _job.SetError(ex.Message);
            }

            try
            {
                await _job.WaitAsync(TimeSpan.FromMinutes(intervalMinutes), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("AI 向量媒合索引排程掃描服務已停止");
    }

    private async Task<EmbeddingSettingsDto?> LoadSettingsAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var settingService = scope.ServiceProvider.GetRequiredService<ISystemSettingService>();
        var result = await settingService.GetSettingAsync<EmbeddingSettingsDto>("Embedding", ct);
        return result.IsSuccess ? result.Data : null;
    }

    private async Task RunScanAsync(int batchSize, CancellationToken ct)
    {
        _job.BeginScan();
        var processed = 0;
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var indexingService = scope.ServiceProvider.GetRequiredService<IContentIndexingService>();
            processed = await indexingService.ReconcileBatchAsync(batchSize, ct);
        }
        finally
        {
            _job.EndScan(processed);
        }

        if (processed > 0)
            _logger.LogInformation("AI 向量媒合索引掃描：本輪處理 {Count} 筆", processed);
        else
            _logger.LogDebug("AI 向量媒合索引掃描：本輪無待處理項目");
    }

    /// <summary>
    /// 全量重新索引：對所有 Demand 與供給端 Company 強制重新產生向量（不比對 hash）。
    /// 每 batchSize 筆換一個 DI scope，避免 DbContext 追蹤的實體越積越多。舊向量在被新向量覆蓋前仍可供搜尋使用。
    /// </summary>
    private async Task RunFullReindexAsync(int batchSize, CancellationToken ct)
    {
        IReadOnlyList<ReindexTarget> targets;
        using (var scope = _serviceProvider.CreateScope())
        {
            var indexingService = scope.ServiceProvider.GetRequiredService<IContentIndexingService>();
            targets = await indexingService.ListReindexTargetsAsync(ct);
        }

        _job.BeginReindex(targets.Count);
        _logger.LogInformation("AI 向量媒合全量重新索引開始：共 {Count} 筆", targets.Count);

        try
        {
            foreach (var chunk in targets.Chunk(batchSize))
            {
                ct.ThrowIfCancellationRequested();
                using var scope = _serviceProvider.CreateScope();
                var indexingService = scope.ServiceProvider.GetRequiredService<IContentIndexingService>();

                foreach (var target in chunk)
                {
                    var ok = false;
                    try
                    {
                        ok = target.SourceType == EmbeddingSourceType.Demand
                            ? int.TryParse(target.SourceId, out var demandId) && await indexingService.IndexDemandAsync(demandId, ct, force: true)
                            : Guid.TryParse(target.SourceId, out var companyId) && await indexingService.IndexCompanyAsync(companyId, ct, force: true);
                    }
                    catch (OperationCanceledException)
                    {
                        throw;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "全量重新索引 {SourceType} {SourceId} 發生例外", target.SourceType, target.SourceId);
                    }

                    _job.AdvanceReindex(ok);
                }
            }
        }
        finally
        {
            _job.EndReindex();
        }

        var snapshot = _job.GetSnapshot();
        _logger.LogInformation("AI 向量媒合全量重新索引完成：{Processed}/{Total} 筆，失敗 {Failed} 筆",
            snapshot.ReindexProcessed, snapshot.ReindexTotal, snapshot.ReindexFailed);
    }
}
