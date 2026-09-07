using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 退信處理背景服務 - 定時檢查並處理退信郵件
/// </summary>
public class BounceProcessingBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BounceProcessingBackgroundService> _logger;

    public BounceProcessingBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<BounceProcessingBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("退信處理背景服務已啟動");

        // 等待應用程式完全啟動
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            BounceMailSettingsDto? settings = null;
            int intervalMinutes = 5; // 預設間隔

            try
            {
                using var scope = _serviceProvider.CreateScope();

                // 讀取設定
                var settingService = scope.ServiceProvider.GetRequiredService<ISystemSettingService>();
                var settingResult = await settingService.GetSettingAsync<BounceMailSettingsDto>("BounceMail", stoppingToken);

                if (settingResult.IsSuccess && settingResult.Data != null)
                {
                    settings = settingResult.Data;
                    intervalMinutes = Math.Max(1, settings.CheckIntervalMinutes);
                }

                if (settings != null && settings.Enabled)
                {
                    _logger.LogDebug("開始處理退信...");

                    var bounceService = scope.ServiceProvider.GetRequiredService<BounceProcessingService>();
                    var result = await bounceService.ProcessBouncesAsync(settings, stoppingToken);

                    if (!result.Success)
                    {
                        _logger.LogWarning("退信處理發生錯誤: {Error}", result.Error);
                    }
                }
                else
                {
                    _logger.LogDebug("退信處理未啟用，跳過");
                }
            }
            catch (OperationCanceledException)
            {
                // 正常停止
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "退信處理背景服務發生例外");
            }

            // 等待下次檢查
            await Task.Delay(TimeSpan.FromMinutes(intervalMinutes), stoppingToken);
        }

        _logger.LogInformation("退信處理背景服務已停止");
    }
}
