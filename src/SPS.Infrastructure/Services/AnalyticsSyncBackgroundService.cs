using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SPS.Application.Interfaces.IServices;

namespace SPS.Infrastructure.Services;

/// <summary>
/// Google Analytics 自動同步：每分鐘檢查一次，到了後台「系統配置 → Google Analytics」設定的時間（預設台灣時間 03:00），
/// 且今天還沒成功跑過，就同步最近幾天（預設 3 天）到資料庫，後台儀表板與分析報表才不用靠人手動按「同步」。
/// 要不要執行、什麼時候執行、失敗重試，都由 <see cref="IAnalyticsService.RunAutoSyncIfDueAsync"/> 決定；
/// 這裡只負責定時呼叫它。服務重啟或在排定時間沒開著，開起來後會補跑；Google Analytics 沒設定時什麼都不做。
/// </summary>
public class AnalyticsSyncBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AnalyticsSyncBackgroundService> _logger;

    public AnalyticsSyncBackgroundService(IServiceProvider serviceProvider, ILogger<AnalyticsSyncBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Google Analytics 自動同步服務已啟動");

        try
        {
            // 讓應用程式先完成啟動（資料庫遷移等）再開始
            await Task.Delay(TimeSpan.FromSeconds(45), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var analytics = scope.ServiceProvider.GetRequiredService<IAnalyticsService>();
                    if (await analytics.RunAutoSyncIfDueAsync(DateTime.UtcNow))
                        _logger.LogInformation("Google Analytics 自動同步已執行");
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    // 單次失敗不能讓背景服務停掉，下一分鐘再檢查
                    _logger.LogError(ex, "Google Analytics 自動同步檢查發生例外");
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            // 正常停止
        }
    }
}
