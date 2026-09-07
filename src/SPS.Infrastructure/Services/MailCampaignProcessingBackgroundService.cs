using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SPS.Application.Interfaces.IServices;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 群發郵件背景處理服務：每 30 秒輪詢一次，挑出到期 Queued 活動實際寄送
/// </summary>
public class MailCampaignProcessingBackgroundService : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan StartupDelay = TimeSpan.FromSeconds(15);

    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MailCampaignProcessingBackgroundService> _logger;

    public MailCampaignProcessingBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<MailCampaignProcessingBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MailCampaign background processor started");
        await Task.Delay(StartupDelay, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<IMailCampaignService>();

                // 連續處理直到沒有到期活動，避免長串排程下單一活動把 worker 卡住
                while (!stoppingToken.IsCancellationRequested
                       && await service.ProcessNextDueAsync(stoppingToken))
                {
                    // 每處理完一個活動就重新取 scope，讓 DbContext 不長期被佔用
                    break;
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "MailCampaign background processor iteration failed");
            }

            try
            {
                await Task.Delay(PollInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("MailCampaign background processor stopped");
    }
}
