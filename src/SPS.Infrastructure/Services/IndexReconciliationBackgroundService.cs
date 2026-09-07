using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;

namespace SPS.Infrastructure.Services;

/// <summary>
/// AI 向量媒合索引排程掃描背景服務——事件觸發（§4.1）的安全網 + 重試 + 初次 backfill。
/// 找出完全沒有 ContentEmbedding 記錄、內容 hash 對不上、或失敗待重試的 Demand/Company，批次補上。
/// 同一套程式碼兼具「日常補漏」與「上線初次 backfill」兩種用途，不需要另外寫一次性工具。
/// 詳見 docs/設計/AI向量媒合搜尋設計.md §4.2。
/// </summary>
public class IndexReconciliationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<IndexReconciliationBackgroundService> _logger;

    private const int BatchSize = 50;
    private const int DefaultIntervalMinutes = 5;

    public IndexReconciliationBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<IndexReconciliationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
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
                using var scope = _serviceProvider.CreateScope();

                var settingService = scope.ServiceProvider.GetRequiredService<ISystemSettingService>();
                var settingResult = await settingService.GetSettingAsync<EmbeddingSettingsDto>("Embedding", stoppingToken);
                var isEnabled = settingResult.IsSuccess && settingResult.Data != null && settingResult.Data.IsEnabled;

                if (isEnabled)
                {
                    var indexingService = scope.ServiceProvider.GetRequiredService<IContentIndexingService>();
                    var processed = await indexingService.ReconcileBatchAsync(BatchSize, stoppingToken);
                    if (processed > 0)
                        _logger.LogInformation("AI 向量媒合索引掃描：本輪處理 {Count} 筆", processed);
                    else
                        _logger.LogDebug("AI 向量媒合索引掃描：本輪無待處理項目");
                }
                else
                {
                    _logger.LogDebug("AI 語意搜尋未啟用，跳過索引掃描");
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI 向量媒合索引排程掃描發生例外");
            }

            await Task.Delay(TimeSpan.FromMinutes(intervalMinutes), stoppingToken);
        }

        _logger.LogInformation("AI 向量媒合索引排程掃描服務已停止");
    }
}
